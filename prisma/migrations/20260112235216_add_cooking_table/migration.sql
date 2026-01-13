-- CreateTable
CREATE TABLE "cooking" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "rating" DECIMAL(65,30) NOT NULL,
    "recipe_url" TEXT,
    "cooked_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooking_pkey" PRIMARY KEY ("id")
);
