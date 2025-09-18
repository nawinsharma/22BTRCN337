-- CreateTable
CREATE TABLE "public"."short_urls" (
    "id" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "shortcode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "validity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "short_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clicks" (
    "id" TEXT NOT NULL,
    "shortUrlId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "location" TEXT,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "short_urls_shortcode_key" ON "public"."short_urls"("shortcode");

-- AddForeignKey
ALTER TABLE "public"."clicks" ADD CONSTRAINT "clicks_shortUrlId_fkey" FOREIGN KEY ("shortUrlId") REFERENCES "public"."short_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
