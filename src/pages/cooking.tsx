import { type NextPage } from "next/types";
import { useState, useCallback, useMemo } from "react";
import { LoadingPage } from "~/components/loading";
import { CookingView } from "~/components/cookingview";
import { ErrorView } from "~/components/errorview";
import { api, type RouterOutputs } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";
import { StarRating } from "~/components/stars";

type CookingEntry = RouterOutputs["cooking"]["getAll"][0];

type AddEntryFormProps = {
  onClose: () => void;
  onSuccess: () => void;
};

type DetailModalProps = {
  entry: CookingEntry;
  onClose: () => void;
};

const DetailModal = ({ entry, onClose }: DetailModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white py-8 px-8 rounded-lg w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>

        <div className="space-y-2 text-sm">
          {entry.recipe_url && (
            <p>
              <Link
                href={entry.recipe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {entry.recipe_url}
              </Link>
            </p>
          )}

          {entry.notes && entry.recipe_url &&(
            <p className="whitespace-pre-wrap pt-2">{entry.notes}</p>
          )}

          {entry.notes && !entry.recipe_url &&(
            <p className="whitespace-pre-wrap">{entry.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = await response.json() as { secure_url: string };
  return data.secure_url;
};

const AddEntryForm = ({ onClose, onSuccess }: AddEntryFormProps) => {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rating, setRating] = useState("5");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [cookedAt, setCookedAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  const createMutation = api.cooking.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setImagePreview(localPreview);

      // Upload to Cloudinary
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        void handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const clearImage = useCallback(() => {
    setImageUrl("");
    setImagePreview(null);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      imageUrl: imageUrl || null,
      rating: parseFloat(rating),
      recipeUrl: recipeUrl || null,
      notes: notes || null,
      cookedAt: new Date(cookedAt!),
    });
  };

  const ratingOptions = [
    "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            {imagePreview || imageUrl ? (
              <div className="relative">
                <Image
                  src={imagePreview || imageUrl}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover rounded"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                    <span className="text-white">Uploading...</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-70"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-black bg-gray-100"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-gray-500">
                    <p className="mb-1">Drag and drop an image here</p>
                    <p className="text-sm">or click to browse</p>
                  </div>
                </label>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating *</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {ratingOptions.map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipe URL</label>
            <input
              type="url"
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Any notes about this recipe..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Cooked *</label>
            <input
              type="date"
              value={cookedAt}
              onChange={(e) => setCookedAt(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading || isUploading}
              className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {createMutation.isLoading ? "Adding..." : isUploading ? "Uploading..." : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CookingEntries = (props: { year: number | "All"; refetchKey: number }) => {
  const { year } = props;
  const { data, isLoading } = getCookingByYear(year);
  const [selectedEntry, setSelectedEntry] = useState<CookingEntry | null>(null);

  const fiveStarEntries = useMemo(
    () => data?.filter((entry) => Number(entry.rating) === 5),
    [data]
  );
  const fourAndHalfStarEntries = useMemo(
    () => data?.filter((entry) => Number(entry.rating) === 4.5),
    [data]
  );
  const fourStarEntries = useMemo(
    () => data?.filter((entry) => Number(entry.rating) === 4),
    [data]
  );
  const threeAndHalfStarEntries = useMemo(
    () => data?.filter((entry) => Number(entry.rating) === 3.5),
    [data]
  );
  const threeStarEntries = useMemo(
    () => data?.filter((entry) => Number(entry.rating) === 3),
    [data]
  );
  const lowerRatedEntries = useMemo(
    () => data?.filter((entry) => Number(entry.rating) < 3),
    [data]
  );

  if (isLoading) {
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );
  }

  if (!data) return <ErrorView />;

  if (data.length === 0) {
    return (
      <div className="pt-12 text-center text-gray-500">
        No cooking entries for this period yet.
      </div>
    );
  }

  const ratingGroups = [
    { entries: fiveStarEntries, rating: 5 },
    { entries: fourAndHalfStarEntries, rating: 4.5 },
    { entries: fourStarEntries, rating: 4 },
    { entries: threeAndHalfStarEntries, rating: 3.5 },
    { entries: threeStarEntries, rating: 3 },
    { entries: lowerRatedEntries, rating: 2.5 },
  ].filter((group) => group.entries && group.entries.length > 0);

  return (
    <>
      <div className="pt-12 pb-12">
        {ratingGroups.map((group, index) => (
          <div key={group.rating}>
            <CookingByStarRating
              entries={group.entries!}
              rating={group.rating}
              onEntryClick={setSelectedEntry}
              className={index === 0 ? "" : ""}
            />
            {index < ratingGroups.length - 1 && (
              <div className="relative flex py-10 items-center">
                <div className="flex-grow border-t border-gray-400 opacity-30"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedEntry && (
        <DetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  );
};

const CookingByStarRating = (props: {
  entries: CookingEntry[];
  rating: number;
  onEntryClick: (entry: CookingEntry) => void;
  className?: string;
}) => {
  const { entries, rating, onEntryClick, className } = props;

  // For the "lower rated" group, show a different label
  const ratingLabel = rating === 2.5 ? "Other" : null;

  return (
    <div className={`container:none grid grid-cols-12 gap-y-1 gap-x-4 overflow-y-scroll max-w-4xl ${className ?? ""}`}>
      <div className="col-span-12 text-xl md:text-2xl opacity-80 mb-4">
        {ratingLabel ?? <StarRating rating={rating} />}
      </div>
      {entries.map((entry) => (
        <CookingView
          {...entry}
          key={entry.id}
          onClick={() => onEntryClick(entry)}
        />
      ))}
    </div>
  );
};

const getCookingByYear = (year: number | "All") => {
  if (year === "All") {
    return api.cooking.getAll.useQuery();
  } else {
    return api.cooking.getByYear.useQuery({ year });
  }
};

const CookingPage: NextPage = () => {
  const supportedYears = getSupportedYears();
  const [selectedYear, setSelectedYear] = useState<number | "All">(
    supportedYears[0] as number
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const { data: allowedData } = api.cooking.isAllowed.useQuery();
  const isAllowed = allowedData?.isAllowed ?? false;

  const utils = api.useContext();

  const handleAddSuccess = () => {
    void utils.cooking.invalidate();
    setRefetchKey((k) => k + 1);
  };

  return (
    <div>
      <div className="relative">
        {isAllowed && (
          <button
            onClick={() => setShowAddForm(true)}
            className="absolute right-0 top-0 px-4 py-1 bg-transparent text-black text-sm rounded border"
          >
            + Add
          </button>
        )}
        <ul>
          {supportedYears.map((year, index) => {
            return (
              <li
                key={index}
                className={`hover:bg-highlight mr-8 inline ${
                  year === selectedYear ? "bg-highlight" : ""
                }`}
              >
                <button
                  onClick={() => setSelectedYear(year as number | "All")}
                >
                  {year}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <CookingEntries year={selectedYear} refetchKey={refetchKey} />
      {showAddForm && (
        <AddEntryForm
          onClose={() => setShowAddForm(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
};

const getSupportedYears = (): Array<number | string> => {
  const firstSupportedYear = 2025;
  const currentYear = new Date().getFullYear();
  const supportedYears = [];
  for (let year = currentYear; year >= firstSupportedYear; year--) {
    supportedYears.push(year);
  }
  supportedYears.push("All");

  return supportedYears;
};

export default CookingPage;
