-- CreateTable
CREATE TABLE "movie" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "my_rating" DECIMAL(65,30),
    "my_review" TEXT,
    "poster_image_url" TEXT,
    "letterboxd_url" TEXT NOT NULL,
    "release_year" INTEGER NOT NULL,
    "watched_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "letterboxd_id" TEXT NOT NULL,

    CONSTRAINT "movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album" (
    "id" TEXT NOT NULL,
    "mbid" TEXT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "last_fm_url" TEXT NOT NULL,
    "cover_art_image_url" TEXT,
    "number_of_tracks" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movie_letterboxd_id_key" ON "movie"("letterboxd_id");

-- CreateIndex
CREATE UNIQUE INDEX "album_last_fm_url_key" ON "album"("last_fm_url");
