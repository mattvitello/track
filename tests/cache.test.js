const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { QueryObserver } = require('@tanstack/react-query');

// Exercise the TypeScript modules using the existing compiler, without a test dependency.
function loadTypeScript(relativePath, base = path.resolve(__dirname, '..')) {
  const filename = path.resolve(base, relativePath);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const compiled = new Module(filename, module);
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled.require = id => {
    const localTs = path.resolve(path.dirname(filename), id + '.ts');
    if (id.startsWith('.') && fs.existsSync(localTs)) {
      return loadTypeScript(localTs);
    }
    return Module.prototype.require.call(compiled, id);
  };
  compiled._compile(output.outputText, filename);
  return compiled.exports;
}
const { cachedQuery, invalidateQueries } = loadTypeScript('src/server/query-cache.ts');
const { createQueryClient, restoreQueryClient } = loadTypeScript('src/utils/query-cache.ts');
const { cookingImageLoader, isCloudinaryImage } = loadTypeScript('src/utils/images.ts');
const clients = [];
const queryKey = [['cooking', 'getByYear'], { input: { year: 2026 }, type: 'query' }];
const storageKey = 'track:public-queries:v1';
function browserStorage() {
  const values = new Map();
  global.window = { localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } };
  return values;
}
function client() {
  const result = createQueryClient();
  restoreQueryClient(result);
  clients.push(result);
  return result;
}
afterEach(() => {
  invalidateQueries('');
  clients.splice(0).forEach(value => value.clear());
  delete global.window;
});

test('fresh reads reuse a result and keep years separate', async () => {
  let calls = 0;
  const load = async () => ++calls;
  assert.equal(await cachedQuery('music:2026', load), 1);
  assert.equal(await cachedQuery('music:2026', load), 1);
  assert.equal(await cachedQuery('music:2025', load), 2);
});
test('concurrent cold requests share one upstream request', async () => {
  let finish;
  let calls = 0;
  const load = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = cachedQuery('movie:2026', load);
  const second = cachedQuery('movie:2026', load);
  await Promise.resolve();
  finish(['film']);
  assert.deepEqual(await Promise.all([first, second]), [['film'], ['film']]);
  assert.equal(calls, 1);
});
test('a failed refresh retains usable stale data', async () => {
  await cachedQuery('music:2026', async () => ['album']);
  assert.deepEqual(await cachedQuery('music:2026', async () => { throw Error('Last.fm unavailable'); }, 0), ['album']);
});
test('cold failures are retried rather than cached', async () => {
  await assert.rejects(cachedQuery('music:2026', async () => { throw Error('unavailable'); }));
  assert.equal(await cachedQuery('music:2026', async () => 'recovered'), 'recovered');
});
test('write invalidation prevents an old in-flight read from repopulating the cache', async () => {
  let finish;
  const first = cachedQuery('cooking:2026', () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve();
  invalidateQueries('cooking:');
  assert.equal(await cachedQuery('cooking:2026', async () => 'new'), 'new');
  finish('old');
  await first;
  assert.equal(await cachedQuery('cooking:2026', async () => 'unexpected'), 'new');
});
test('stale data older than a day is not returned after a failed refresh', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  await cachedQuery('movie:2026', async () => 'old');
  now += 25 * 60 * 60 * 1000;
  await assert.rejects(cachedQuery('movie:2026', async () => { throw Error('unavailable'); }));
});
test('browser restores public data and dates immediately, marking it for background refresh', () => {
  const values = browserStorage();
  const cookedAt = new Date('2026-10-01T00:00:00Z');
  client().setQueryData(queryKey, [{ name: 'Recipe', cookedAt }]);
  assert.ok(values.get(storageKey));
  const restored = client();
  assert.deepEqual(restored.getQueryData(queryKey), [{ name: 'Recipe', cookedAt }]);
  assert.equal(restored.getQueryState(queryKey).isInvalidated, true);
});
test('permissions and writes are excluded from persistent storage', () => {
  const values = browserStorage();
  const cache = client();
  cache.setQueryData([['cooking', 'isAllowed']], { isAllowed: true });
  cache.setQueryData([['movie', 'create']], { id: 'secret' });
  cache.setQueryData(queryKey, []);
  assert.ok(!values.get(storageKey).includes('isAllowed'));
  assert.ok(!values.get(storageKey).includes('secret'));
});
test('expired persisted queries are ignored', () => {
  browserStorage();
  client().setQueryData(queryKey, [], { updatedAt: Date.now() - 25 * 60 * 60 * 1000 });
  assert.equal(client().getQueryData(queryKey), undefined);
});
test('corrupt or unavailable browser storage does not prevent loading', () => {
  browserStorage().set(storageKey, '{broken');
  assert.equal(client().getQueryData(queryKey), undefined);
  Object.defineProperty(window, 'localStorage', { get() { throw Error('blocked'); } });
  assert.doesNotThrow(() => client().setQueryData(queryKey, []));
});
test('storage quota errors do not prevent fresh results from being displayed', () => {
  browserStorage();
  window.localStorage.setItem = () => { throw Error('quota'); };
  const cache = client();
  cache.setQueryData(queryKey, ['recipe']);
  assert.deepEqual(cache.getQueryData(queryKey), ['recipe']);
});
test('Cloudinary thumbnails request a square crop at the selected responsive width', () => {
  const src = 'https://res.cloudinary.com/example/image/upload/v123/recipe.jpg';
  assert.equal(isCloudinaryImage(src), true);
  assert.equal(cookingImageLoader({ src, width: 256 }), 'https://res.cloudinary.com/example/image/upload/c_fill,g_auto,w_256,h_256/f_auto,q_auto/v123/recipe.jpg');
  assert.equal(isCloudinaryImage('/empty-poster.png'), false);
  assert.equal(isCloudinaryImage('https://example.com/image/upload/recipe.jpg'), false);
});

const { publicCacheHeaders } = loadTypeScript('src/server/public-cache.ts');
const { revalidateCatalog } = loadTypeScript('src/server/revalidate-catalog.ts');
const { getCatalogYears } = loadTypeScript('src/utils/catalog.ts');

test('a generated catalog stays visible without refetching until invalidated', async () => {
  const cache = client();
  cache.setQueryData(queryKey, ['saved'], { updatedAt: Date.now() - 5 * 60 * 1000 });
  let reads = 0;
  const observer = new QueryObserver(cache, {
    queryKey,
    queryFn: async () => { reads++; return ['new']; },
  });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await Promise.resolve();
    assert.equal(reads, 0);
    assert.deepEqual(observer.getCurrentResult().data, ['saved']);
    await cache.invalidateQueries({ queryKey });
    assert.equal(reads, 1);
    assert.deepEqual(observer.getCurrentResult().data, ['new']);
  } finally {
    unsubscribe();
  }
});
test('music chart responses can be shared, but mixed permission batches cannot', () => {
  assert.match(publicCacheHeaders('query', ['music.getMostListenedToAlbumsByYear'], false)['Cache-Control'], /s-maxage=300/);
  assert.equal(publicCacheHeaders('query', ['music.getMostListenedToAlbums', 'cooking.isAllowed'], false)['Cache-Control'], 'private, no-store');
});
test('writes, errors, and movie/recipe API reads bypass shared caching', () => {
  for (const [type, paths, errors] of [
    ['mutation', ['music.getMostListenedToAlbums'], false],
    ['query', ['music.getMostListenedToAlbums'], true],
    ['query', ['cooking.getByYear'], false],
    ['query', ['movie.create'], false],
    ['query', ['movie.getAllByMinimumRating'], false],
    ['unknown', undefined, false],
    ['query', [], false],
  ]) assert.equal(publicCacheHeaders(type, paths, errors)['Cache-Control'], 'private, no-store');
});
test('successful writes regenerate their public catalog', async () => {
  const paths = [];
  const ctx = { revalidateCatalog: async path => { paths.push(path); } };
  await revalidateCatalog(ctx, 'movies');
  await revalidateCatalog(ctx, 'cooking');
  assert.deepEqual(paths, ['/movies', '/cooking']);
});
test('regeneration failure does not turn a committed write into a failed save', async t => {
  t.mock.method(console, 'warn', () => {});
  await assert.doesNotReject(revalidateCatalog({ revalidateCatalog: async () => { throw Error('unavailable'); } }, 'cooking'));
  await assert.doesNotReject(revalidateCatalog({}, 'movies'));
});
test('year filters use the snapshot year, including through New Year hydration', () => {
  assert.deepEqual(getCatalogYears(2025, 2026), [2026, 2025, 'All']);
  assert.deepEqual(getCatalogYears(2025, 2027), [2027, 2026, 2025, 'All']);
});
