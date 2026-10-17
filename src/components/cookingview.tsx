import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";
import { cookingImageLoader, isCloudinaryImage } from "~/utils/images";

type CookingEntry = RouterOutputs["cooking"]["getAll"][0];

type CookingViewProps = CookingEntry & {
  onClick: () => void;
};

export const CookingView = (props: CookingViewProps) => {
  const { onClick, ...entry } = props;
  const imageUrl = entry.image_url ? entry.image_url : "/empty-poster.png";

  return (
    <div
      key={entry.id}
      className="relative col-span-6 sm:col-span-4 lg:col-span-3 cursor-pointer"
      onClick={onClick}
    >
      <Image
        src={imageUrl}
        loader={isCloudinaryImage(imageUrl) ? cookingImageLoader : undefined}
        alt={entry.name}
        sizes="(min-width: 1280px) 208px, (min-width: 1024px) 16vw, (min-width: 768px) 22vw, (min-width: 640px) 30vw, 45vw"
        style={{
          width: "100%",
          height: "auto",
        }}
        width={200}
        height={200}
        className="object-cover aspect-square"
      />
      <div>
        <p className="opacity-70 pt-1 line-clamp-1 text-xs leading-4 text-black">
          {entry.name}
        </p>
      </div>
    </div>
  );
};
