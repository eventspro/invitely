var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/r2Storage.ts
var r2Storage_exports = {};
__export(r2Storage_exports, {
  CloudflareR2Storage: () => CloudflareR2Storage,
  r2Storage: () => r2Storage
});
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
var CloudflareR2Storage, r2Storage;
var init_r2Storage = __esm({
  "server/r2Storage.ts"() {
    "use strict";
    CloudflareR2Storage = class {
      s3Client = null;
      bucketName;
      publicUrl;
      constructor() {
        const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
        const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
        const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
        this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
        this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";
        if (!accountId || !accessKey || !secretKey || !this.bucketName || !this.publicUrl) {
          console.warn("\u26A0\uFE0F Cloudflare R2 configuration missing. Image uploads will use local storage only.");
          return;
        }
        this.s3Client = new S3Client({
          region: "auto",
          // R2 uses 'auto' region
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey
          }
        });
        console.log("\u2705 Cloudflare R2 storage initialized");
      }
      /**
       * Upload an image to R2 storage
       */
      async uploadImage(templateId, file, originalFilename, mimetype, category = "gallery") {
        if (!this.s3Client) {
          throw new Error("R2 storage not initialized");
        }
        const ext = originalFilename.split(".").pop() || "jpg";
        const uniqueFilename = `${templateId}-${category}-${Date.now()}-${randomUUID()}.${ext}`;
        const key = `templates/${templateId}/${category}/${uniqueFilename}`;
        try {
          const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file,
            ContentType: mimetype,
            Metadata: {
              templateId,
              category,
              originalFilename,
              uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
          await this.s3Client.send(command);
          const publicUrl = `${this.publicUrl}/${key}`;
          console.log(`\u{1F4F8} Image uploaded to R2: ${uniqueFilename}`);
          return {
            url: publicUrl,
            filename: uniqueFilename
          };
        } catch (error) {
          console.error("\u274C R2 upload error:", error);
          throw new Error(`Failed to upload image to R2: ${error}`);
        }
      }
      /**
       * Delete an image from R2 storage
       */
      async deleteImage(templateId, filename, category = "gallery") {
        if (!this.s3Client) {
          throw new Error("R2 storage not initialized");
        }
        const key = `templates/${templateId}/${category}/${filename}`;
        try {
          const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key
          });
          await this.s3Client.send(command);
          console.log(`\u{1F5D1}\uFE0F Image deleted from R2: ${filename}`);
        } catch (error) {
          console.error("\u274C R2 delete error:", error);
          throw new Error(`Failed to delete image from R2: ${error}`);
        }
      }
      /**
       * Generate a presigned URL for direct upload (for client-side uploads)
       */
      async getPresignedUploadUrl(templateId, filename, mimetype, category = "gallery") {
        if (!this.s3Client) {
          throw new Error("R2 storage not initialized");
        }
        const key = `templates/${templateId}/${category}/${filename}`;
        try {
          const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: mimetype
          });
          const presignedUrl = await getSignedUrl(this.s3Client, command, {
            expiresIn: 3600
            // 1 hour
          });
          return {
            url: presignedUrl,
            fields: {
              key,
              "Content-Type": mimetype
            }
          };
        } catch (error) {
          console.error("\u274C R2 presigned URL error:", error);
          throw new Error(`Failed to generate presigned URL: ${error}`);
        }
      }
      /**
       * Check if R2 is properly configured
       */
      isConfigured() {
        return !!this.s3Client;
      }
      /**
       * Get public URL for an image
       */
      getPublicUrl(templateId, filename, category = "gallery") {
        const key = `templates/${templateId}/${category}/${filename}`;
        return `${this.publicUrl}/${key}`;
      }
    };
    r2Storage = new CloudflareR2Storage();
  }
});

// client/src/config/wedding-config.ts
var weddingConfig;
var init_wedding_config = __esm({
  "client/src/config/wedding-config.ts"() {
    "use strict";
    weddingConfig = {
      // Couple Information
      couple: {
        groomName: "\u0540\u0561\u0580\u0578\u0582\u0569",
        brideName: "\u054F\u0561\u0569\u0587",
        combinedNames: "\u0540\u0561\u0580\u0578\u0582\u0569 & \u054F\u0561\u0569\u0587"
      },
      // Wedding Date & Time
      wedding: {
        date: "2025-10-11T16:00:00",
        // Format: YYYY-MM-DDTHH:MM:SS (11/10/2025 04:00 PM)
        displayDate: "11 \u0540\u0578\u056F\u057F\u0565\u0574\u0562\u0565\u0580 2025",
        month: "11 \u0540\u0578\u056F\u057F\u0565\u0574\u0562\u0565\u0580 2025",
        day: "11"
      },
      // Hero Section
      hero: {
        invitation: "\u0540\u0580\u0561\u057E\u056B\u0580\u0578\u0582\u0574 \u0565\u0576\u0584 \u0574\u0565\u0580 \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B\u0576",
        welcomeMessage: "\u054A\u0561\u057F\u0580\u0561\u057D\u057F\u057E\u0565\u0584 \u0574\u0565\u0580 \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B\u0576",
        musicButton: "\u0535\u0580\u0561\u056A\u0577\u057F\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
        playIcon: "\u25B6\uFE0F",
        pauseIcon: "\u23F8\uFE0F",
        images: [
          "/attached_assets/default-wedding-couple.jpg",
          "/attached_assets/couple11.jpg"
        ]
        // Hero background images array
      },
      // Countdown Section
      countdown: {
        subtitle: "\u0540\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B\u0576 \u0574\u0576\u0561\u0581\u0565\u056C \u0567",
        backgroundImage: "/attached_assets/image_1755881009663.png",
        // Romantic couple background for Armenian template
        labels: {
          days: "\u0585\u0580",
          hours: "\u056A\u0561\u0574",
          minutes: "\u0580\u0578\u057A\u0565",
          seconds: "\u057E\u0561\u0575\u0580\u056F\u0575\u0561\u0576"
        }
      },
      // Calendar Section
      calendar: {
        title: "\u054A\u0561\u057F\u0580\u0561\u057D\u057F\u057E\u0565\u0584 \u0574\u0565\u0580 \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B\u0576",
        description: "\u0544\u056B\u0561\u0581\u0580\u0565\u0584 \u0571\u0565\u0580 \u0585\u0580\u0561\u0581\u0578\u0582\u0575\u0581\u056B\u0576",
        monthTitle: "\u0540\u0578\u056F\u057F\u0565\u0574\u0562\u0565\u0580 2025",
        dayLabels: ["\u053F\u056B\u0580", "\u0535\u0580\u056F", "\u0535\u0580\u0584", "\u0549\u0578\u0580", "\u0540\u0576\u0563", "\u0548\u0582\u0580\u0562", "\u0547\u0562\u0569"]
      },
      // Locations
      locations: {
        sectionTitle: "\u054E\u0561\u0575\u0580\u0565\u0580",
        venues: [
          {
            id: "ceremony",
            title: "\u0535\u056F\u0565\u0572\u0565\u0581\u056B",
            name: "\u054D\u0578\u0582\u0580\u0562 \u0533\u0580\u056B\u0563\u0578\u0580 \u053C\u0578\u0582\u057D\u0561\u057E\u0578\u0580\u056B\u0579 \u0535\u056F\u0565\u0572\u0565\u0581\u056B",
            description: "\u054A\u057D\u0561\u056F\u0561\u0564\u0580\u0578\u0582\u0569\u0575\u0561\u0576 \u0561\u0580\u0561\u0580\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
            mapButton: "\u0532\u0561\u0581\u0565\u056C \u0584\u0561\u0580\u057F\u0565\u0566\u0578\u0582\u0574",
            mapIcon: "\u{1F5FA}\uFE0F"
          },
          {
            id: "reception",
            title: "\u0543\u0561\u0577\u0561\u0580\u0561\u0576",
            name: "\u0532\u0561\u0575\u0561\u0566\u0565\u057F \u0540\u0578\u056C\u056C",
            description: "\u0538\u0576\u0564\u0578\u0582\u0576\u0565\u056C\u0578\u0582\u0569\u0575\u0561\u0576 \u0587 \u057F\u0578\u0576\u0561\u056F\u0561\u057F\u0561\u0580\u0578\u0582\u0569\u0575\u0561\u0576 \u057E\u0561\u0575\u0580",
            mapButton: "\u0532\u0561\u0581\u0565\u056C \u0584\u0561\u0580\u057F\u0565\u0566\u0578\u0582\u0574",
            mapIcon: "\u{1F5FA}\uFE0F"
          }
        ]
      },
      // Timeline Events
      timeline: {
        title: "\u053E\u0580\u0561\u0563\u056B\u0580",
        events: [
          {
            time: "14:30",
            title: "\u054A\u057D\u0561\u056F\u0561\u0564\u0580\u0578\u0582\u0569\u0575\u0561\u0576 \u0561\u0580\u0561\u0580\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576"
          },
          {
            time: "17:30",
            title: "\u0540\u0561\u0580\u057D\u0561\u0576\u0575\u0561\u0581 \u057D\u0580\u0561\u0570",
            description: "Bayazet Hall"
          },
          {
            time: "24:00",
            title: "\u0531\u057E\u0561\u0580\u057F",
            description: ""
          }
        ],
        afterMessage: {
          thankYou: "\u0547\u0576\u0578\u0580\u0570\u0561\u056F\u0561\u056C\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u0574\u0565\u0566 \u0570\u0565\u057F \u0561\u0575\u057D \u0570\u0561\u057F\u0578\u0582\u056F \u0585\u0580\u0568 \u056F\u056B\u057D\u0565\u056C\u0578\u0582 \u0570\u0561\u0574\u0561\u0580",
          notes: "\u0541\u0565\u0566 \u0570\u0565\u057F \u0562\u0565\u0580\u0565\u0584 \u054D\u0535\u0550, \u056A\u057A\u056B\u057F\u0576\u0565\u0580 \u0578\u0582 \u0561\u0576\u057D\u0561\u0570\u0574\u0561\u0576 \u0564\u0580\u0561\u056F\u0561\u0576 \u0567\u0574\u0578\u0581\u056B\u0561\u0576\u0565\u0580, \u056B\u0576\u0579\u057A\u0565\u057D \u0576\u0561\u0587 \u0570\u0561\u0580\u0574\u0561\u0580\u0561\u057E\u0565\u057F \u056F\u0578\u0577\u056B\u056F\u0576\u0565\u0580\u055D \u057A\u0561\u0580\u0565\u056C\u0578\u0582 \u0570\u0561\u0574\u0561\u0580\u0589\n\u0539\u0578\u0582\u0575\u056C \u057F\u0561\u0576\u0584, \u0578\u0580 \u0561\u0575\u0564 \u0585\u0580\u0568 \u057D\u057A\u056B\u057F\u0561\u056F \u0566\u0563\u0565\u057D\u057F\u0578\u057E \u056C\u056B\u0576\u056B \u0574\u056B\u0561\u0575\u0576 \u0570\u0561\u0580\u057D\u0576\u0561\u0581\u0578\u0582\u0576 \u{1F90D}"
        }
      },
      // RSVP Section
      rsvp: {
        title: "\u0540\u0561\u0580\u0581\u0561\u0569\u0565\u0580\u0569\u056B\u056F",
        description: "\u053D\u0576\u0564\u0580\u0578\u0582\u0574 \u0565\u0576\u0584 \u0570\u0561\u057D\u057F\u0561\u057F\u0565\u056C \u0571\u0565\u0580 \u0574\u0561\u057D\u0576\u0561\u056F\u0581\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568 \u0574\u056B\u0576\u0579\u0587 \u0540\u0578\u056F\u057F\u0565\u0574\u0562\u0565\u0580\u056B 1-\u0568",
        form: {
          firstName: "\u0531\u0576\u0578\u0582\u0576",
          firstNamePlaceholder: "\u0541\u0565\u0580 \u0561\u0576\u0578\u0582\u0576\u0568",
          lastName: "\u0531\u0566\u0563\u0561\u0576\u0578\u0582\u0576",
          lastNamePlaceholder: "\u0541\u0565\u0580 \u0561\u0566\u0563\u0561\u0576\u0578\u0582\u0576\u0568",
          email: "\u0537\u056C\u2024 \u0570\u0561\u057D\u0581\u0565",
          emailPlaceholder: "your@email.com",
          guestCount: "\u0540\u0575\u0578\u0582\u0580\u0565\u0580\u056B \u0584\u0561\u0576\u0561\u056F",
          guestCountPlaceholder: "\u0538\u0576\u057F\u0580\u0565\u0584 \u0570\u0575\u0578\u0582\u0580\u0565\u0580\u056B \u0584\u0561\u0576\u0561\u056F\u0568",
          guestNames: "\u0540\u0575\u0578\u0582\u0580\u0565\u0580\u056B \u0561\u0576\u0578\u0582\u0576\u0576\u0565\u0580\u0568 \u0587 \u0561\u0566\u0563\u0561\u0576\u0578\u0582\u0576\u0576\u0565\u0580\u0568",
          guestNamesPlaceholder: "\u0546\u0577\u0565\u0584 \u0562\u0578\u056C\u0578\u0580 \u0570\u0575\u0578\u0582\u0580\u0565\u0580\u056B \u0561\u0576\u0578\u0582\u0576\u0576\u0565\u0580\u0568 \u0587 \u0561\u0566\u0563\u0561\u0576\u0578\u0582\u0576\u0576\u0565\u0580\u0568",
          attendance: "\u0544\u0561\u057D\u0576\u0561\u056F\u0581\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
          attendingYes: "\u054D\u056B\u0580\u0578\u057E \u056F\u0574\u0561\u057D\u0576\u0561\u056F\u0581\u0565\u0574 \u{1F90D}",
          attendingNo: "\u0551\u0561\u057E\u0578\u0584, \u0579\u0565\u0574 \u056F\u0561\u0580\u0578\u0572",
          submitButton: "\u0548\u0582\u0572\u0561\u0580\u056F\u0565\u056C \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574\u0568",
          submittingButton: "\u0548\u0582\u0572\u0561\u0580\u056F\u057E\u0578\u0582\u0574 \u0567..."
        },
        guestOptions: [
          { value: "1", label: "1 \u0570\u0575\u0578\u0582\u0580" },
          { value: "2", label: "2 \u0570\u0575\u0578\u0582\u0580" },
          { value: "3", label: "3 \u0570\u0575\u0578\u0582\u0580" },
          { value: "4", label: "4 \u0570\u0575\u0578\u0582\u0580" },
          { value: "5+", label: "5+ \u0570\u0575\u0578\u0582\u0580" }
        ],
        messages: {
          success: "\u0541\u0565\u0580 \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574\u0568 \u0578\u0582\u0572\u0561\u0580\u056F\u057E\u0565\u0581",
          error: "\u054D\u056D\u0561\u056C \u0567 \u057F\u0565\u0572\u056B \u0578\u0582\u0576\u0565\u0581\u0565\u056C",
          loading: "\u0548\u0582\u0572\u0561\u0580\u056F\u057E\u0578\u0582\u0574 \u0567...",
          required: "\u054A\u0561\u0580\u057F\u0561\u0564\u056B\u0580 \u0564\u0561\u0577\u057F"
        }
      },
      // Photo Section
      photos: {
        title: "\u0546\u056F\u0561\u0580\u0576\u0565\u0580",
        description: "\u053F\u056B\u057D\u057E\u0565\u0584 \u0571\u0565\u0580 \u0576\u056F\u0561\u0580\u0576\u0565\u0580\u0578\u057E",
        downloadButton: "\u0546\u0565\u0580\u0562\u0565\u057C\u0576\u0565\u056C \u0576\u056F\u0561\u0580\u0576\u0565\u0580\u0568",
        uploadButton: "\u0531\u057E\u0565\u056C\u0561\u0581\u0576\u0565\u056C \u0576\u056F\u0561\u0580",
        comingSoonMessage: "\u0546\u056F\u0561\u0580\u0576\u0565\u0580\u056B \u0570\u0572\u0578\u0582\u0574\u0568 \u056F\u0570\u0561\u057D\u0561\u0576\u0565\u056C\u056B \u056C\u056B\u0576\u056B \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B\u0581 \u0570\u0565\u057F\u0578",
        images: [
          "/attached_assets/default-wedding-couple.jpg",
          "/attached_assets/Blog_Banner_Left_Hand_Story_1755890185205.webp",
          "/attached_assets/heart-tattoo.jfif"
        ]
        // Gallery images array
      },
      // Navigation
      navigation: {
        home: "\u0533\u056C\u056D\u0561\u057E\u0578\u0580",
        countdown: "\u0540\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B\u0576 \u0574\u0576\u0561\u0581\u0565\u056C \u0567\u2024\u2024\u2024",
        calendar: "\u0555\u0580\u0561\u0581\u0578\u0582\u0575\u0581",
        locations: "\u054E\u0561\u0575\u0580\u0565\u0580",
        timeline: "\u053E\u0580\u0561\u0563\u056B\u0580",
        rsvp: "\u0540\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574",
        photos: "\u0546\u056F\u0561\u0580\u0576\u0565\u0580"
      },
      // Footer
      footer: {
        thankYouMessage: ""
      },
      // UI Elements & Icons
      ui: {
        icons: {
          heart: "\u{1F90D}",
          infinity: "\u221E",
          music: "\u{1F3B5}",
          calendar: "\u{1F4C5}",
          location: "\u{1F4CD}",
          clock: "\u{1F552}",
          camera: "\u{1F4F7}",
          email: "\u{1F4E7}",
          phone: "\u{1F4DE}"
        },
        buttons: {
          loading: "\u0532\u0565\u057C\u0576\u057E\u0578\u0582\u0574 \u0567...",
          close: "\u0553\u0561\u056F\u0565\u056C",
          cancel: "\u0549\u0565\u0572\u0561\u0580\u056F\u0565\u056C",
          save: "\u054A\u0561\u0570\u057A\u0561\u0576\u0565\u056C",
          back: "\u054E\u0565\u0580\u0561\u0564\u0561\u057C\u0576\u0561\u056C",
          next: "\u0540\u0561\u057B\u0578\u0580\u0564"
        },
        messages: {
          loading: "\u0532\u0565\u057C\u0576\u057E\u0578\u0582\u0574 \u0567...",
          error: "\u054D\u056D\u0561\u056C \u0567 \u057F\u0565\u0572\u056B \u0578\u0582\u0576\u0565\u0581\u0565\u056C",
          success: "\u0540\u0561\u057B\u0578\u0572\u0578\u0582\u0569\u0575\u0561\u0574\u0562 \u057A\u0561\u0570\u057A\u0561\u0576\u057E\u0565\u0581",
          notFound: "\u0549\u056B \u0563\u057F\u0576\u057E\u0565\u056C",
          offline: "\u053B\u0576\u057F\u0565\u0580\u0576\u0565\u057F \u056F\u0561\u057A \u0579\u056F\u0561"
        }
      },
      // Map Modal Configuration
      mapModal: {
        title: "\u054F\u0565\u0572\u0561\u0574\u0561\u057D",
        closeButton: "\u0553\u0561\u056F\u0565\u056C",
        loadingMessage: "\u0554\u0561\u0580\u057F\u0565\u0566\u0568 \u0562\u0565\u057C\u0576\u057E\u0578\u0582\u0574 \u0567...",
        errorMessage: "\u0554\u0561\u0580\u057F\u0565\u0566\u0568 \u0562\u0565\u057C\u0576\u0565\u056C \u0579\u057E\u057D\u057F\u0561\u0570\u057E\u0565\u0581"
      },
      // Email Configuration (for admin use)
      email: {
        recipients: ["harutavetisyan0@gmail.com", "tatevhovsepyan22@gmail.com"]
      },
      // Maintenance Mode Configuration
      maintenance: {
        enabled: false,
        // Toggle this to enable/disable maintenance mode
        password: "haruttev2025",
        // Password to bypass maintenance mode
        title: "Coming Soon",
        subtitle: "",
        message: "",
        countdownText: "\u0544\u056B\u0576\u0579\u0587 \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u0568",
        passwordPrompt: "",
        wrongPassword: "\u054D\u056D\u0561\u056C \u0563\u0561\u0572\u057F\u0576\u056B \u056F\u0578\u0564",
        enterPassword: "\u0544\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0565\u056C \u056F\u0578\u0564\u0568"
      }
    };
  }
});

// client/src/templates/pro/config.ts
var config_exports = {};
__export(config_exports, {
  defaultConfig: () => defaultConfig
});
var defaultConfig;
var init_config = __esm({
  "client/src/templates/pro/config.ts"() {
    "use strict";
    init_wedding_config();
    defaultConfig = {
      ...weddingConfig,
      // Add sections control (default: all enabled)
      sections: {
        hero: { enabled: true },
        countdown: { enabled: true },
        calendar: { enabled: true },
        locations: { enabled: true },
        timeline: { enabled: true },
        rsvp: { enabled: true },
        photos: { enabled: true }
      },
      // Add theme configuration
      theme: {
        colors: {
          primary: "hsl(340, 45%, 65%)",
          // --soft-gold converted to actual value
          secondary: "hsl(340, 20%, 80%)",
          // --sage-green converted to actual value
          accent: "hsl(340, 15%, 15%)",
          // --charcoal converted to actual value
          background: "hsl(340, 30%, 97%)"
          // --cream converted to actual value
        },
        fonts: {
          heading: "Playfair Display, serif",
          body: "Inter, sans-serif"
        }
      }
    };
  }
});

// client/src/templates/classic/config.ts
var config_exports2 = {};
__export(config_exports2, {
  defaultConfig: () => defaultConfig2
});
var defaultConfig2;
var init_config2 = __esm({
  "client/src/templates/classic/config.ts"() {
    "use strict";
    defaultConfig2 = {
      couple: {
        groomName: "John",
        brideName: "Jane",
        combinedNames: "John & Jane"
      },
      wedding: {
        date: "2025-06-15T16:00:00",
        displayDate: "June 15th, 2025",
        month: "June",
        day: "15th"
      },
      hero: {
        invitation: "You're Invited to Our Wedding",
        welcomeMessage: "We're getting married and we want you to celebrate with us!",
        musicButton: "Play Music",
        playIcon: "\u25B6\uFE0F",
        pauseIcon: "\u23F8\uFE0F",
        images: [
          "/attached_assets/default-wedding-couple.jpg",
          "/attached_assets/couple11.jpg"
        ]
      },
      countdown: {
        subtitle: "Until our big day",
        backgroundImage: "",
        // Empty = no background image
        labels: {
          days: "Days",
          hours: "Hours",
          minutes: "Minutes",
          seconds: "Seconds"
        }
      },
      calendar: {
        title: "Mark Your Calendar",
        description: "Save the date for our wedding",
        monthTitle: "Wedding Date",
        dayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      },
      locations: {
        sectionTitle: "Wedding Locations",
        venues: [
          {
            id: "ceremony",
            title: "Ceremony",
            name: "St. Mary's Church",
            description: "Join us for our wedding ceremony at this beautiful historic church.",
            mapButton: "View on Map",
            mapIcon: "\u{1F4CD}"
          },
          {
            id: "reception",
            title: "Reception",
            name: "Grand Ballroom",
            description: "Celebrate with us at our reception with dinner and dancing.",
            mapButton: "View on Map",
            mapIcon: "\u{1F4CD}"
          }
        ]
      },
      timeline: {
        title: "Wedding Day Schedule",
        events: [
          {
            time: "4:00 PM",
            title: "Wedding Ceremony",
            description: "At St. Mary's Church"
          },
          {
            time: "5:30 PM",
            title: "Cocktail Hour",
            description: "Photos and drinks"
          },
          {
            time: "7:00 PM",
            title: "Reception Dinner",
            description: "At Grand Ballroom"
          },
          {
            time: "9:00 PM",
            title: "Dancing",
            description: "Party the night away!"
          }
        ],
        afterMessage: {
          thankYou: "Thank you for celebrating with us",
          notes: "Your presence is the greatest gift"
        }
      },
      rsvp: {
        title: "Please RSVP",
        description: "We hope you can join us on our special day. Please respond by May 1st, 2025.",
        form: {
          firstName: "First Name",
          firstNamePlaceholder: "Your first name",
          lastName: "Last Name",
          lastNamePlaceholder: "Your last name",
          email: "Email Address",
          emailPlaceholder: "your@email.com",
          guestCount: "Number of Guests",
          guestCountPlaceholder: "Select number",
          guestNames: "Guest Names",
          guestNamesPlaceholder: "Names of all attendees",
          attendance: "Will you attend?",
          attendingYes: "Yes, I'll be there!",
          attendingNo: "Sorry, can't make it",
          submitButton: "Send RSVP",
          submittingButton: "Sending..."
        },
        guestOptions: [
          { value: "1", label: "1 Guest" },
          { value: "2", label: "2 Guests" },
          { value: "3", label: "3 Guests" },
          { value: "4", label: "4 Guests" },
          { value: "5", label: "5 Guests" },
          { value: "6", label: "6 Guests" }
        ],
        messages: {
          success: "Thank you! Your RSVP has been received.",
          error: "There was an error submitting your RSVP. Please try again.",
          loading: "Submitting your RSVP...",
          required: "This field is required."
        }
      },
      photos: {
        title: "Our Photos",
        description: "Share in our memories",
        downloadButton: "Download",
        uploadButton: "Upload Photo",
        comingSoonMessage: "Photos coming soon",
        images: ["/attached_assets/default-wedding-couple.jpg"]
      },
      navigation: {
        home: "Home",
        countdown: "Countdown",
        calendar: "Calendar",
        locations: "Locations",
        timeline: "Schedule",
        rsvp: "RSVP",
        photos: "Photos"
      },
      footer: {
        thankYouMessage: "Thank you for being part of our love story. We can't wait to celebrate with you!"
      },
      email: {
        recipients: []
      },
      maintenance: {
        enabled: false,
        password: "admin123",
        title: "Under Maintenance",
        subtitle: "We'll be back soon",
        message: "Website under maintenance",
        countdownText: "Estimated time",
        passwordPrompt: "Enter password",
        wrongPassword: "Incorrect password",
        enterPassword: "Submit"
      },
      ui: {
        icons: {
          heart: "\u{1F90D}",
          infinity: "\u221E",
          music: "\u{1F3B5}",
          calendar: "\u{1F4C5}",
          location: "\u{1F4CD}",
          clock: "\u{1F552}",
          camera: "\u{1F4F7}",
          email: "\u{1F4E7}",
          phone: "\u{1F4DE}"
        },
        buttons: {
          loading: "Loading...",
          close: "Close",
          cancel: "Cancel",
          save: "Save",
          back: "Back",
          next: "Next"
        },
        messages: {
          loading: "Loading...",
          error: "An error occurred",
          success: "Successfully saved",
          notFound: "Not found",
          offline: "No internet connection"
        }
      },
      mapModal: {
        title: "Location",
        closeButton: "Close",
        loadingMessage: "Loading map...",
        errorMessage: "Failed to load map"
      },
      sections: {
        hero: { enabled: true },
        countdown: { enabled: true },
        calendar: { enabled: true },
        locations: { enabled: true },
        timeline: { enabled: true },
        rsvp: { enabled: true },
        photos: { enabled: true }
      },
      theme: {
        colors: {
          primary: "#831843",
          // Deep burgundy
          secondary: "#be185d",
          // Muted rose  
          accent: "#6366f1",
          // Soft indigo
          background: "#fef7ff"
          // Very light lavender
        },
        fonts: {
          heading: "Playfair Display",
          body: "Inter"
        }
      }
    };
  }
});

// client/src/templates/elegant/config.ts
var config_exports3 = {};
__export(config_exports3, {
  defaultConfig: () => defaultConfig3
});
var defaultConfig3;
var init_config3 = __esm({
  "client/src/templates/elegant/config.ts"() {
    "use strict";
    init_wedding_config();
    defaultConfig3 = {
      ...weddingConfig,
      // Override countdown to remove background image for elegant theme
      countdown: {
        ...weddingConfig.countdown,
        backgroundImage: ""
        // No background image for elegant template
      },
      // Add sections control (default: all enabled)
      sections: {
        hero: { enabled: true },
        countdown: { enabled: true },
        calendar: { enabled: true },
        locations: { enabled: true },
        timeline: { enabled: true },
        rsvp: { enabled: true },
        photos: { enabled: true }
      },
      // Elegant navy/silver theme
      theme: {
        colors: {
          primary: "#1e3a8a",
          // Deep navy blue
          secondary: "#475569",
          // Slate gray  
          accent: "#94a3b8",
          // Silver gray
          background: "#f1f5f9"
          // Very light slate
        },
        fonts: {
          heading: "Playfair Display, serif",
          body: "Inter, sans-serif"
        }
      }
    };
  }
});

// client/src/templates/romantic/config.ts
var config_exports4 = {};
__export(config_exports4, {
  defaultConfig: () => defaultConfig4
});
var defaultConfig4;
var init_config4 = __esm({
  "client/src/templates/romantic/config.ts"() {
    "use strict";
    init_wedding_config();
    defaultConfig4 = {
      ...weddingConfig,
      // Override countdown to remove background image for romantic theme
      countdown: {
        ...weddingConfig.countdown,
        backgroundImage: ""
        // No background image for romantic template
      },
      // Add sections control (default: all enabled)
      sections: {
        hero: { enabled: true },
        countdown: { enabled: true },
        calendar: { enabled: true },
        locations: { enabled: true },
        timeline: { enabled: true },
        rsvp: { enabled: true },
        photos: { enabled: true }
      },
      // Romantic dusty rose/mauve theme
      theme: {
        colors: {
          primary: "#9f1239",
          // Deep rose
          secondary: "#be123c",
          // Muted crimson  
          accent: "#a855f7",
          // Soft purple
          background: "#fdf2f8"
          // Very light rose
        },
        fonts: {
          heading: "Playfair Display, serif",
          body: "Inter, sans-serif"
        }
      }
    };
  }
});

// client/src/templates/nature/config.ts
var config_exports5 = {};
__export(config_exports5, {
  defaultConfig: () => defaultConfig5
});
var defaultConfig5;
var init_config5 = __esm({
  "client/src/templates/nature/config.ts"() {
    "use strict";
    init_wedding_config();
    defaultConfig5 = {
      ...weddingConfig,
      // Override countdown to remove background image for nature theme
      countdown: {
        ...weddingConfig.countdown,
        backgroundImage: ""
        // No background image for nature template
      },
      // Add sections control (default: all enabled)
      sections: {
        hero: { enabled: true },
        countdown: { enabled: true },
        calendar: { enabled: true },
        locations: { enabled: true },
        timeline: { enabled: true },
        rsvp: { enabled: true },
        photos: { enabled: true }
      },
      // Nature sage/forest theme
      theme: {
        colors: {
          primary: "#166534",
          // Deep forest green
          secondary: "#15803d",
          // Forest green  
          accent: "#a3a3a3",
          // Warm gray
          background: "#f7f8f7"
          // Very light sage
        },
        fonts: {
          heading: "Playfair Display, serif",
          body: "Inter, sans-serif"
        }
      }
    };
  }
});

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path4 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default;
var init_vite_config = __esm({
  async "vite.config.ts"() {
    "use strict";
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay(),
        ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
          await import("@replit/vite-plugin-cartographer").then(
            (m) => m.cartographer()
          )
        ] : []
      ],
      resolve: {
        alias: {
          "@": path4.resolve(import.meta.dirname, "client", "src"),
          "@shared": path4.resolve(import.meta.dirname, "shared"),
          "@assets": path4.resolve(import.meta.dirname, "public", "attached_assets")
        }
      },
      root: path4.resolve(import.meta.dirname, "client"),
      publicDir: path4.resolve(import.meta.dirname, "public"),
      build: {
        outDir: path4.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ["react", "react-dom"],
              router: ["wouter"],
              ui: ["@radix-ui/react-tooltip", "@radix-ui/react-toast"]
            }
          }
        }
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"]
        },
        proxy: {
          "/api": {
            target: "http://localhost:5001",
            changeOrigin: true
          }
        }
      },
      optimizeDeps: {
        include: ["react", "react-dom", "wouter"]
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express4 from "express";
import fs4 from "fs";
import path5 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/")) {
      return next();
    }
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path5.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express4.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}
var viteLogger;
var init_vite = __esm({
  async "server/vite.ts"() {
    "use strict";
    await init_vite_config();
    viteLogger = createLogger();
  }
});

// server/index.ts
import "dotenv/config";
import express5 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  googleDriveIntegrations: () => googleDriveIntegrations,
  guestPhotos: () => guestPhotos,
  images: () => images,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertGoogleDriveIntegrationSchema: () => insertGoogleDriveIntegrationSchema,
  insertGuestPhotoSchema: () => insertGuestPhotoSchema,
  insertLegacyUserSchema: () => insertLegacyUserSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertRsvpSchema: () => insertRsvpSchema,
  insertTemplateSchema: () => insertTemplateSchema,
  insertUserAdminPanelSchema: () => insertUserAdminPanelSchema,
  insertUserSchema: () => insertUserSchema,
  managementUsers: () => managementUsers,
  orders: () => orders,
  rsvps: () => rsvps,
  settings: () => settings,
  templates: () => templates,
  updateTemplateSchema: () => updateTemplateSchema,
  userAdminPanels: () => userAdminPanels,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var managementUsers = pgTable("management_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  status: text("status").default("active"),
  // active, suspended, deleted
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: varchar("user_id").references(() => managementUsers.id, { onDelete: "set null" }),
  templateId: varchar("template_id").references(() => templates.id, { onDelete: "cascade" }),
  templatePlan: text("template_plan").notNull(),
  // basic, standard, premium, deluxe, ultimate
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  status: text("status").default("pending"),
  // pending, completed, cancelled, refunded
  paymentMethod: text("payment_method"),
  paymentIntentId: text("payment_intent_id"),
  adminAccessGranted: boolean("admin_access_granted").default(false),
  customerDetails: jsonb("customer_details"),
  // name, email, phone, address
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var userAdminPanels = pgTable("user_admin_panels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => managementUsers.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  templateSlug: text("template_slug").notNull().unique(),
  // URL slug for customer access
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  googleDriveFolderId: text("google_drive_folder_id"),
  settings: jsonb("settings"),
  // custom admin panel settings
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var guestPhotos = pgTable("guest_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  uploaderName: text("uploader_name").notNull(),
  uploaderEmail: text("uploader_email"),
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  isApproved: boolean("is_approved").default(false),
  isFeatured: boolean("is_featured").default(false),
  uploadedAt: timestamp("uploaded_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var googleDriveIntegrations = pgTable("google_drive_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAdminPanelId: varchar("user_admin_panel_id").notNull().references(() => userAdminPanels.id, { onDelete: "cascade" }),
  folderId: text("folder_id").notNull(),
  folderName: text("folder_name").notNull(),
  folderUrl: text("folder_url").notNull(),
  accessType: text("access_type").default("view"),
  // view, edit, comment
  specialGuestEmails: jsonb("special_guest_emails"),
  // array of emails with special access
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => managementUsers.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => templates.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  // login, approve_photo, export_rsvps, configure_drive, etc.
  entityType: text("entity_type"),
  // rsvp, photo, guest_photo, google_drive, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  // additional context about the action
  createdAt: timestamp("created_at").default(sql`now()`)
});
var templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  templateKey: text("template_key").notNull(),
  ownerEmail: text("owner_email"),
  config: jsonb("config").notNull(),
  maintenance: boolean("maintenance").default(false),
  maintenancePassword: text("maintenance_password"),
  sourceTemplateId: varchar("source_template_id"),
  isMain: boolean("is_main").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var rsvps = pgTable("rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  name: text("name"),
  // Combined name field for compatibility
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  // Updated to match migration
  guestPhone: text("guest_phone"),
  attending: boolean("attending"),
  // Updated to boolean for proper filtering
  guests: integer("guests").default(1),
  // Number of guests
  dietaryRestrictions: text("dietary_restrictions"),
  plusOneName: text("plus_one_name"),
  specialRequests: text("special_requests"),
  submittedAt: timestamp("submitted_at").default(sql`now()`),
  // Updated field name
  // Legacy fields for backwards compatibility
  email: text("email").notNull(),
  guestCount: text("guest_count").notNull(),
  guestNames: text("guest_names"),
  attendance: text("attendance").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var settings = pgTable("settings", {
  key: text("key").primaryKey(),
  templateId: varchar("template_id").references(() => templates.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var images = pgTable("images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  category: text("category").default("gallery"),
  // gallery, hero, background, etc.
  size: text("size"),
  // file size in bytes as string
  mimeType: text("mime_type"),
  order: text("order").default("0"),
  // for ordering images
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var insertUserSchema = createInsertSchema(managementUsers).pick({
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  phone: true
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters long")
});
var insertLegacyUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  templatePlan: z.enum(["basic", "standard", "premium", "deluxe", "ultimate"]),
  amount: z.string().transform((val) => parseFloat(val)),
  currency: z.string().default("AMD")
});
var insertUserAdminPanelSchema = createInsertSchema(userAdminPanels).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertGuestPhotoSchema = createInsertSchema(guestPhotos).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  uploaderName: z.string().min(1, "Uploader name is required"),
  photoUrl: z.string().url("Valid photo URL is required")
});
var insertGoogleDriveIntegrationSchema = createInsertSchema(googleDriveIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  folderName: z.string().min(1, "Folder name is required"),
  accessType: z.enum(["view", "edit", "comment"]).default("view")
});
var insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true
});
var insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().min(1, "Template name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be URL-friendly"),
  templateKey: z.string().min(1, "Template key is required"),
  ownerEmail: z.string().email().optional(),
  config: z.record(z.any()),
  // Wedding config object
  maintenance: z.boolean().optional(),
  maintenancePassword: z.string().optional()
});
var updateTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).partial();
var insertRsvpSchema = createInsertSchema(rsvps).omit({
  id: true,
  createdAt: true,
  submittedAt: true
}).extend({
  templateId: z.string().min(1, "Template ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  guestEmail: z.string().email("Email address is invalid").or(z.literal("")).optional(),
  guests: z.number().min(1, "Number of guests is required").optional(),
  attending: z.boolean().nullable().optional(),
  // Legacy compatibility fields - required for backward compatibility
  email: z.string().email("Email address is invalid"),
  guestCount: z.string().min(1, "Number of guests is required"),
  guestNames: z.string().optional(),
  attendance: z.enum(["attending", "not-attending"], {
    errorMap: () => ({ message: "Please select attendance status" })
  })
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
console.log("\u{1F517} Connecting to database with URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 1e4,
  idleTimeoutMillis: 3e4,
  max: 10
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, or } from "drizzle-orm";
var DatabaseStorage = class {
  // User management
  async getUser(id) {
    const [user] = await db.select().from(managementUsers).where(eq(managementUsers.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(managementUsers).where(eq(managementUsers.email, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(managementUsers).values(insertUser).returning();
    return user;
  }
  // Template management
  async getAllTemplates() {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }
  async getTemplate(id) {
    try {
      console.log(`\u{1F50D} Searching for template with ID: ${id}`);
      const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
      console.log(`\u{1F4CA} Query result count: ${result.length}`);
      if (result.length > 0) {
        console.log(`\u2705 Found template: ${result[0].name} (ID: ${result[0].id})`);
      } else {
        console.log(`\u274C No template found with ID: ${id}`);
      }
      return result[0];
    } catch (error) {
      console.error(`\u274C Database error in getTemplate:`, error);
      throw error;
    }
  }
  async getTemplateBySlug(slug) {
    try {
      console.log(`\u{1F50D} Searching for template with slug: ${slug}`);
      console.log(`\u{1F517} Database URL available: ${!!process.env.DATABASE_URL}`);
      const result = await db.select().from(templates).where(eq(templates.slug, slug)).limit(1);
      console.log(`\u{1F4CA} Query result count: ${result.length}`);
      if (result.length > 0) {
        console.log(`\u2705 Found template: ${result[0].name} (ID: ${result[0].id})`);
      } else {
        console.log(`\u274C No template found with slug: ${slug}`);
      }
      return result[0];
    } catch (error) {
      console.error(`\u274C Database error in getTemplateBySlug:`, error);
      console.error(`\u274C Error details:`, {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        slug,
        databaseUrl: !!process.env.DATABASE_URL
      });
      throw error;
    }
  }
  async createTemplate(insertTemplate) {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }
  async updateTemplate(id, updates) {
    const [template] = await db.update(templates).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(templates.id, id)).returning();
    return template || void 0;
  }
  async deleteTemplate(id) {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // RSVP management (template-scoped)
  async createRsvp(insertRsvp) {
    const [rsvp] = await db.insert(rsvps).values(insertRsvp).returning();
    return rsvp;
  }
  async getAllRsvps(templateId) {
    if (templateId) {
      return await db.select().from(rsvps).where(eq(rsvps.templateId, templateId)).orderBy(desc(rsvps.createdAt));
    }
    return await db.select().from(rsvps).orderBy(desc(rsvps.createdAt));
  }
  async getRsvpByEmail(email, templateId) {
    const [rsvp] = await db.select().from(rsvps).where(and(
      eq(rsvps.templateId, templateId),
      or(
        eq(rsvps.email, email),
        eq(rsvps.guestEmail, email)
      )
    ));
    return rsvp || void 0;
  }
  // Image management
  async createImage(imageData) {
    const [image] = await db.insert(images).values({
      templateId: imageData.templateId,
      url: imageData.url,
      name: imageData.name,
      category: imageData.category || "gallery",
      size: imageData.size,
      mimeType: imageData.mimeType,
      order: imageData.order || "0"
    }).returning();
    return image;
  }
  async getImages(templateId, category) {
    const conditions = category ? and(eq(images.templateId, templateId), eq(images.category, category)) : eq(images.templateId, templateId);
    return await db.select().from(images).where(conditions).orderBy(images.order, images.createdAt);
  }
  async deleteImage(id) {
    const result = await db.delete(images).where(eq(images.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Settings (template-scoped)
  async getMaintenanceStatus(templateId) {
    try {
      if (templateId) {
        const template = await this.getTemplate(templateId);
        return template?.maintenance || false;
      }
      return false;
    } catch (error) {
      console.warn("Maintenance status check failed, defaulting to false:", error);
      return false;
    }
  }
  async setMaintenanceStatus(enabled, templateId) {
    if (templateId) {
      await this.updateTemplate(templateId, { maintenance: enabled });
    } else {
      await db.insert(settings).values({
        key: "maintenance_enabled",
        value: enabled.toString()
      }).onConflictDoUpdate({
        target: settings.key,
        set: {
          value: enabled.toString(),
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
    }
  }
};
var storage = new DatabaseStorage();

// server/email.ts
var emailServiceInitialized = false;
var emailServiceAvailable = false;
var brevoClient = null;
var brevo = null;
async function initializeEmailService() {
  if (!emailServiceInitialized) {
    if (!process.env.BREVO_API_KEY) {
      console.warn(
        "BREVO_API_KEY environment variable is not set. Email notifications will be disabled."
      );
      emailServiceAvailable = false;
    } else {
      try {
        if (!brevo) {
          brevo = await import("@getbrevo/brevo");
        }
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
        brevoClient = apiInstance;
        emailServiceAvailable = true;
        console.log("\u2705 Brevo email service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Brevo:", error);
        emailServiceAvailable = false;
      }
    }
    emailServiceInitialized = true;
  }
  return emailServiceAvailable;
}
async function sendEmail(params) {
  if (!await initializeEmailService() || !brevoClient) {
    console.log("Email service not configured.");
    return false;
  }
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: params.from, name: "Invitely" };
    sendSmtpEmail.to = [{ email: params.to }];
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.textContent = params.text || "";
    sendSmtpEmail.htmlContent = params.html || "";
    await brevoClient.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error("Brevo email error:", error);
    return false;
  }
}
async function testEmailService() {
  if (!await initializeEmailService()) {
    console.log("Brevo email service not configured.");
    return;
  }
  const testEmails = [
    "harutavetisyan0@gmail.com",
    "tatevhovsepyan22@gmail.com"
  ];
  for (const email of testEmails) {
    try {
      console.log(`\u{1F9EA} Testing Brevo email to: ${email}`);
      const success = await sendEmail({
        from: "noreply@invitely.am",
        // Use your verified domain
        to: email,
        subject: "Test - Brevo Email Service Check",
        text: `This is a test email for ${email}. If you receive this email, Brevo is working correctly.`,
        html: `<p>This is a test email for <strong>${email}</strong>. If you receive this email, <strong>Brevo</strong> is working correctly.</p>`
      });
      if (success) {
        console.log(`\u2705 Brevo test email sent successfully to ${email}`);
      } else {
        console.log(`\u274C Brevo test email failed for ${email}`);
      }
    } catch (error) {
      console.error(`\u274C Brevo test email failed for ${email}:`, error);
    }
  }
}
async function sendTemplateRsvpNotificationEmails(rsvp, template) {
  if (!await initializeEmailService()) {
    console.log("Email service not configured. Skipping template RSVP notification emails.");
    return false;
  }
  try {
    const config = template.config;
    const couple = config.couple || {};
    const wedding = config.wedding || {};
    const email = config.email || {};
    let recipientEmails = [];
    if (template.ownerEmail) {
      recipientEmails = [template.ownerEmail];
      console.log(`\u{1F4E7} Using template owner email: ${template.ownerEmail}`);
    } else if (email.recipients && email.recipients.length > 0) {
      recipientEmails = email.recipients;
      console.log(`\u{1F4E7} Using config recipient emails: ${email.recipients.join(", ")}`);
    } else {
      recipientEmails = [
        "harutavetisyan0@gmail.com",
        "tatevhovsepyan22@gmail.com"
      ];
      console.log(`\u{1F4E7} Using fallback couple emails`);
    }
    const coupleNames = couple.combinedNames || `${couple.groomName || "Groom"} & ${couple.brideName || "Bride"}`;
    const weddingDate = wedding.displayDate || wedding.date || "Wedding Day";
    const attendanceText = rsvp.attendance === "attending" ? "\u053F\u0563\u0561" : "\u0549\u056B \u0563\u0561\u056C\u056B\u057D";
    const guestInfo = rsvp.guestNames ? `
\u0540\u0575\u0578\u0582\u0580\u0565\u0580: ${rsvp.guestNames}` : "";
    const emailPromises = recipientEmails.map(
      (emailAddr) => sendEmail({
        from: "noreply@invitely.am",
        // Use your verified domain
        to: emailAddr,
        subject: `\u0546\u0578\u0580 \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574 \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B \u0570\u0561\u0574\u0561\u0580 - ${rsvp.firstName} ${rsvp.lastName}`,
        text: `\u0546\u0578\u0580 RSVP \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574

\u0531\u0576\u0578\u0582\u0576: ${rsvp.firstName} ${rsvp.lastName}
\u0537\u056C\u2024 \u0570\u0561\u057D\u0581\u0565: ${rsvp.email}
\u0540\u0575\u0578\u0582\u0580\u0565\u0580\u056B \u0584\u0561\u0576\u0561\u056F: ${rsvp.guestCount}
\u0544\u0561\u057D\u0576\u0561\u056F\u0581\u0578\u0582\u0569\u0575\u0578\u0582\u0576: ${attendanceText}${guestInfo}

\u0540\u0561\u057D\u057F\u0561\u057F\u057E\u0565\u056C \u0567: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : (/* @__PURE__ */ new Date()).toLocaleString("hy-AM")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
            <h2 style="color: #333; text-align: center; font-weight: normal;">\u0546\u0578\u0580 \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574 ${coupleNames} \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B \u0570\u0561\u0574\u0561\u0580</h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #333; margin-bottom: 15px; font-weight: normal;">\u0540\u0575\u0578\u0582\u0580\u056B \u057F\u057E\u0575\u0561\u056C\u0576\u0565\u0580</h3>
              <p style="margin: 8px 0;"><strong>\u0531\u0576\u0578\u0582\u0576:</strong> ${rsvp.firstName} ${rsvp.lastName}</p>
              <p style="margin: 8px 0;"><strong>\u0537\u056C\u2024 \u0570\u0561\u057D\u0581\u0565:</strong> ${rsvp.email}</p>
              <p style="margin: 8px 0;"><strong>\u0540\u0575\u0578\u0582\u0580\u0565\u0580\u056B \u0584\u0561\u0576\u0561\u056F:</strong> ${rsvp.guestCount}</p>
              <p style="margin: 8px 0;"><strong>\u0544\u0561\u057D\u0576\u0561\u056F\u0581\u0578\u0582\u0569\u0575\u0578\u0582\u0576:</strong> ${attendanceText}</p>
              ${guestInfo}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; margin: 0;">\u0540\u0561\u057D\u057F\u0561\u057F\u057E\u0565\u056C \u0567: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : (/* @__PURE__ */ new Date()).toLocaleString("hy-AM")}</p>
              <p style="color: #666; font-size: 12px; margin-top: 10px;">\u054F\u0565\u0574\u0583\u056C\u0565\u0575\u0569: ${template.name || template.templateKey}</p>
            </div>
          </div>
        `
      })
    );
    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter((result) => result.status === "fulfilled").length;
    console.log(`Template RSVP notification emails sent: ${successCount}/${recipientEmails.length} for template ${template.id}`);
    return successCount > 0;
  } catch (error) {
    console.error("Failed to send template RSVP notification emails:", error);
    return false;
  }
}
async function sendTemplateRsvpConfirmationEmail(rsvp, template) {
  if (!await initializeEmailService()) {
    console.log("Email service not configured. Skipping template RSVP confirmation email.");
    return false;
  }
  try {
    const config = template.config;
    const couple = config.couple || {};
    const wedding = config.wedding || {};
    const locations = config.locations || [];
    const coupleNames = couple.combinedNames || `${couple.groomName || "Groom"} & ${couple.brideName || "Bride"}`;
    const weddingDate = wedding.displayDate || wedding.date || "Wedding Day";
    const attendanceText = rsvp.attendance === "attending" ? "\u0547\u0561\u057F \u0578\u0582\u0580\u0561\u056D \u0565\u0576\u0584, \u0578\u0580 \u056F\u0563\u0561\u0584 \u0574\u0565\u0580 \u0570\u0561\u0580\u057D\u0561\u0576\u056B\u0584\u056B\u0576! \u{1F495}" : "\u0551\u0561\u057E\u0578\u0584, \u0578\u0580 \u0579\u0565\u0584 \u056F\u0561\u0580\u0578\u0572\u0561\u0576\u0561 \u0563\u0561\u056C: \u0551\u0561\u0576\u056F\u0561\u0576\u0578\u0582\u0574 \u0565\u0576\u0584 \u0571\u0565\u0566 \u0562\u0561\u0580\u0565\u056C\u0561\u057E\u0578\u0582\u0569\u0575\u0578\u0582\u0576: \u{1F499}";
    let locationInfo = "";
    if (rsvp.attendance === "attending" && locations.length > 0) {
      locationInfo = locations.map((loc, index) => {
        const emoji = index === 0 ? "\u{1F4CD}" : "\u{1F37E}";
        return `
          <h3 style="color: #E4A5B8; margin-bottom: 10px;">${emoji} ${loc.title || `Location ${index + 1}`}</h3>
          <p><strong>${loc.name || "Venue"}</strong><br/>
          ${loc.time ? `\u053A\u0561\u0574\u0568 ${loc.time}` : ""}${loc.address ? `<br/>${loc.address}` : ""}</p>
        `;
      }).join("");
    }
    const success = await sendEmail({
      from: "noreply@invitely.am",
      // Use your verified domain
      to: rsvp.email || "",
      subject: `\u0541\u0565\u0580 \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574\u0568 \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 - ${coupleNames} - ${weddingDate}`,
      text: `\u054D\u056B\u0580\u0565\u056C\u056B ${rsvp.firstName},

\u0547\u0576\u0578\u0580\u0570\u0561\u056F\u0561\u056C\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u0571\u0565\u0580 \u0570\u0561\u057D\u057F\u0561\u057F\u0574\u0561\u0576 \u0570\u0561\u0574\u0561\u0580:

${attendanceText}

${rsvp.attendance === "attending" && locations.length > 0 ? locations.map((loc) => `${loc.title || "Venue"}: ${loc.name || "TBD"}${loc.time ? ` - ${loc.time}` : ""}`).join("\n") : ""}

\u0540\u0561\u0580\u0563\u0561\u0576\u0584\u0578\u057E,
${coupleNames}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E4A5B8; font-style: italic;">${coupleNames}</h1>
            <p style="color: #666; font-size: 18px;">${weddingDate}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 25px; border-radius: 15px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 15px;">\u0547\u0576\u0578\u0580\u0570\u0561\u056F\u0561\u056C\u0578\u0582\u0569\u0575\u0578\u0582\u0576 ${rsvp.firstName}\u0568!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">${attendanceText}</p>
            
            ${rsvp.attendance === "attending" && locationInfo ? `
              <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 10px;">
                ${locationInfo}
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                \u0544\u0565\u0576\u0584 \u057D\u057A\u0561\u057D\u0578\u0582\u0574 \u0565\u0576\u0584 \u0561\u0575\u057D \u0570\u0561\u057F\u0578\u0582\u056F \u0585\u0580\u0568 \u0571\u0565\u0566 \u0570\u0565\u057F \u056F\u056B\u057D\u0565\u056C\u0578\u0582\u0576: \u{1F490}
              </p>
            ` : ""}
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>\u0540\u0561\u0580\u0563\u0561\u0576\u0584\u0578\u057E, ${coupleNames}</p>
          </div>
        </div>
      `
    });
    if (success) {
      console.log(`Template RSVP confirmation email sent to: ${rsvp.email} for template ${template.id}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send template RSVP confirmation email:", error);
    return false;
  }
}

// server/routes.ts
import path3 from "path";
import fs3 from "fs";
import multer3 from "multer";

// server/routes/auth.ts
import express from "express";
import { eq as eq3, and as and3, sql as sql2 } from "drizzle-orm";

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq as eq2, and as and2 } from "drizzle-orm";
var JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
var JWT_EXPIRES_IN = "7d";
var BCRYPT_ROUNDS = 12;
var hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};
var comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
var generateToken = (userId, email, additionalPayload) => {
  const payload = {
    userId,
    email,
    ...additionalPayload
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
var verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
var generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
var authenticateUser = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "development" || process.env.VERCEL === "1") {
      console.log("\u{1F513} Development/Demo mode: Bypassing user authentication");
      req.user = {
        id: "dev-user-123",
        email: "dev@example.com",
        firstName: "Dev",
        lastName: "User",
        status: "active"
      };
      return next();
    }
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const [user] = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      status: managementUsers.status
    }).from(managementUsers).where(and2(
      eq2(managementUsers.id, decoded.userId),
      eq2(managementUsers.status, "active")
    ));
    if (!user) {
      return res.status(401).json({ error: "User not found or inactive" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || void 0,
      lastName: user.lastName || void 0,
      status: user.status || "active"
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};
var requireAdminPanelAccess = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "development" || process.env.VERCEL === "1") {
      console.log("\u{1F513} Development/Demo mode: Bypassing admin panel authentication");
      req.adminPanel = {
        id: "dev-panel",
        userId: "dev-user",
        templateId: req.params.templateId || req.body.templateId,
        orderId: "dev-order",
        isActive: true,
        templatePlan: "ultimate"
      };
      return next();
    }
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const templateId = req.params.templateId || req.body.templateId;
    if (!templateId) {
      return res.status(400).json({ error: "Template ID required" });
    }
    const [adminPanel] = await db.select({
      id: userAdminPanels.id,
      userId: userAdminPanels.userId,
      templateId: userAdminPanels.templateId,
      orderId: userAdminPanels.orderId,
      isActive: userAdminPanels.isActive,
      templatePlan: orders.templatePlan
    }).from(userAdminPanels).leftJoin(orders, eq2(userAdminPanels.orderId, orders.id)).where(and2(
      eq2(userAdminPanels.userId, req.user.id),
      eq2(userAdminPanels.templateId, templateId),
      eq2(userAdminPanels.isActive, true),
      eq2(orders.status, "completed"),
      eq2(orders.templatePlan, "ultimate")
    ));
    if (!adminPanel) {
      return res.status(403).json({
        error: "Admin panel access denied. Ultimate template purchase required."
      });
    }
    req.adminPanel = {
      ...adminPanel,
      templatePlan: adminPanel.templatePlan || "basic"
    };
    next();
  } catch (error) {
    console.error("Admin panel access check error:", error);
    res.status(500).json({ error: "Failed to verify admin panel access" });
  }
};

// server/routes/auth.ts
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
var router = express.Router();
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 attempts per window
  message: { error: "Too many authentication attempts, please try again later" }
});
var emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 3,
  // 3 emails per hour
  message: { error: "Too many email requests, please try again later" }
});
var createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, orderNumber } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    const existingUser = await db.select().from(managementUsers).where(eq3(managementUsers.email, email.toLowerCase())).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: "User with this email already exists" });
    }
    let order = null;
    if (orderNumber) {
      const orderResult = await db.select().from(orders).where(
        and3(
          eq3(orders.orderNumber, orderNumber),
          eq3(orders.templatePlan, "ultimate"),
          eq3(orders.status, "completed")
        )
      ).limit(1);
      if (orderResult.length === 0) {
        return res.status(400).json({
          error: "Invalid order number or order is not for Ultimate template"
        });
      }
      order = orderResult[0];
      if (order.userId) {
        return res.status(400).json({ error: "This order is already linked to another user" });
      }
    }
    const passwordHash = await hashPassword(password);
    const emailVerificationToken = generateSecureToken();
    const userResult = await db.insert(managementUsers).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone,
      emailVerificationToken
    }).returning({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName
    });
    const user = userResult[0];
    if (order) {
      await db.update(orders).set({
        userId: user.id,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(orders.id, order.id));
      if (order.templatePlan === "ultimate" && order.templateId) {
        const [template] = await db.select({ slug: templates.slug }).from(templates).where(eq3(templates.id, order.templateId)).limit(1);
        if (template) {
          await db.insert(userAdminPanels).values({
            userId: user.id,
            templateId: order.templateId,
            templateSlug: template.slug,
            orderId: order.id,
            isActive: true
          });
          await db.update(orders).set({ adminAccessGranted: true }).where(eq3(orders.id, order.id));
        }
      }
    }
    if (process.env.SMTP_USER) {
      try {
        const transporter = createEmailTransporter();
        const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5001"}/verify-email?token=${emailVerificationToken}`;
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: "Verify Your Wedding Site Account",
          html: `
            <h2>Welcome to Wedding Sites!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}" style="background: #d4af37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
            <p>If you didn't create this account, you can safely ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }
    const token = generateToken(user.id, user.email);
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: false
      },
      token,
      hasAdminAccess: !!order && order.templatePlan === "ultimate"
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const userResult = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      passwordHash: managementUsers.passwordHash,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      status: managementUsers.status,
      emailVerified: managementUsers.emailVerified
    }).from(managementUsers).where(eq3(managementUsers.email, email.toLowerCase())).limit(1);
    if (userResult.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = userResult[0];
    if (user.status !== "active") {
      return res.status(401).json({ error: "Account is suspended or deleted" });
    }
    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    await db.update(managementUsers).set({ lastLogin: /* @__PURE__ */ new Date() }).where(eq3(managementUsers.id, user.id));
    const adminPanelResult = await db.select({
      id: userAdminPanels.id,
      templateId: userAdminPanels.templateId,
      templateName: templates.name,
      templateSlug: templates.slug,
      isActive: userAdminPanels.isActive
    }).from(userAdminPanels).innerJoin(templates, eq3(userAdminPanels.templateId, templates.id)).innerJoin(orders, eq3(userAdminPanels.orderId, orders.id)).where(
      and3(
        eq3(userAdminPanels.userId, user.id),
        eq3(userAdminPanels.isActive, true),
        eq3(orders.status, "completed")
      )
    );
    const token = generateToken(user.id, user.email);
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        hasAdminAccess: adminPanelResult.length > 0,
        adminPanels: adminPanelResult
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});
router.post("/template-login", authLimiter, async (req, res) => {
  res.status(404).json({
    error: "This endpoint is deprecated. Please use /login instead."
  });
});
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Verification token required" });
    }
    const userResult = await db.select({ id: managementUsers.id }).from(managementUsers).where(eq3(managementUsers.emailVerificationToken, token)).limit(1);
    if (userResult.length === 0) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }
    const userId = userResult[0].id;
    await db.update(managementUsers).set({
      emailVerified: true,
      emailVerificationToken: null
    }).where(eq3(managementUsers.id, userId));
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
});
router.post("/forgot-password", emailLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const userResult = await db.select({ id: managementUsers.id }).from(managementUsers).where(
      and3(
        eq3(managementUsers.email, email.toLowerCase()),
        eq3(managementUsers.status, "active")
      )
    ).limit(1);
    if (userResult.length === 0) {
      return res.json({ message: "If an account with that email exists, a password reset link has been sent" });
    }
    const userId = userResult[0].id;
    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1e3);
    await db.update(managementUsers).set({
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    }).where(eq3(managementUsers.id, userId));
    if (process.env.SMTP_USER) {
      try {
        const transporter = createEmailTransporter();
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5001"}/reset-password?token=${resetToken}`;
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: "Reset Your Password",
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background: #d4af37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
    }
    res.json({ message: "If an account with that email exists, a password reset link has been sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Password reset request failed" });
  }
});
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    const userResult = await db.select({ id: managementUsers.id }).from(managementUsers).where(
      and3(
        eq3(managementUsers.passwordResetToken, token),
        sql2`password_reset_expires > now()`
      )
    ).limit(1);
    if (userResult.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    const userId = userResult[0].id;
    const passwordHash = await hashPassword(newPassword);
    await db.update(managementUsers).set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    }).where(eq3(managementUsers.id, userId));
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Password reset failed" });
  }
});
router.get("/profile", authenticateUser, async (req, res) => {
  try {
    const userResult = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      phone: managementUsers.phone,
      status: managementUsers.status,
      emailVerified: managementUsers.emailVerified,
      lastLogin: managementUsers.lastLogin,
      createdAt: managementUsers.createdAt
    }).from(managementUsers).where(eq3(managementUsers.id, req.user.id)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult[0];
    const adminPanelResult = await db.select({
      id: userAdminPanels.id,
      templateId: userAdminPanels.templateId,
      templateName: templates.name,
      templateSlug: templates.slug,
      orderNumber: orders.orderNumber,
      isActive: userAdminPanels.isActive
    }).from(userAdminPanels).innerJoin(templates, eq3(userAdminPanels.templateId, templates.id)).innerJoin(orders, eq3(userAdminPanels.orderId, orders.id)).where(
      and3(
        eq3(userAdminPanels.userId, req.user.id),
        eq3(userAdminPanels.isActive, true)
      )
    );
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      adminPanels: adminPanelResult
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    await db.update(managementUsers).set({
      firstName,
      lastName,
      phone,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(managementUsers.id, req.user.id));
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
router.post("/create-order", async (req, res) => {
  try {
    const { email, templateId, templatePlan, totalAmount, paymentMethod } = req.body;
    if (!email || !templateId || !templatePlan || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [user] = await db.select().from(managementUsers).where(eq3(managementUsers.email, email));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [order] = await db.insert(orders).values({
      orderNumber,
      userId: user.id,
      templateId,
      templatePlan,
      amount: totalAmount,
      paymentMethod: paymentMethod || "card",
      status: "completed",
      adminAccessGranted: templatePlan.toLowerCase() === "ultimate"
    }).returning();
    if (templatePlan.toLowerCase() === "ultimate") {
      const [template] = await db.select({ slug: templates.slug }).from(templates).where(eq3(templates.id, templateId)).limit(1);
      if (template) {
        await db.insert(userAdminPanels).values({
          userId: user.id,
          templateId,
          templateSlug: template.slug,
          orderId: order.id,
          isActive: true
        });
      }
    }
    res.json({
      message: "Order created successfully",
      order,
      adminPanelCreated: templatePlan.toLowerCase() === "ultimate"
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});
router.get("/debug-user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const [user] = await db.select().from(managementUsers).where(eq3(managementUsers.email, email));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userOrders = await db.select().from(orders).where(eq3(orders.userId, user.id));
    const adminPanels = await db.select().from(userAdminPanels).where(eq3(userAdminPanels.userId, user.id));
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      },
      orders: userOrders,
      adminPanels
    });
  } catch (error) {
    console.error("Debug user error:", error);
    res.status(500).json({ error: "Debug failed" });
  }
});
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});
var auth_default = router;

// server/routes/admin-panel.ts
import express2 from "express";
import { eq as eq4, and as and4, desc as desc2, count, sql as sql3 } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import ExcelJS from "exceljs";
var router2 = express2.Router();
var storage2 = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "guest-photos");
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: storage2,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
router2.get("/:templateId/dashboard", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId } = req.params;
    const rsvpStatsResult = await db.select({
      totalRsvps: count(),
      attendingCount: sql3`COUNT(CASE WHEN ${rsvps.attending} = true THEN 1 END)`,
      notAttendingCount: sql3`COUNT(CASE WHEN ${rsvps.attending} = false THEN 1 END)`,
      pendingCount: sql3`COUNT(CASE WHEN ${rsvps.attending} IS NULL THEN 1 END)`
    }).from(rsvps).where(eq4(rsvps.templateId, templateId));
    const rsvpStats = rsvpStatsResult[0];
    const recentRsvps = await db.select({
      name: rsvps.name,
      guestEmail: rsvps.guestEmail,
      attending: rsvps.attending,
      submittedAt: rsvps.submittedAt,
      specialRequests: rsvps.specialRequests
    }).from(rsvps).where(eq4(rsvps.templateId, templateId)).orderBy(desc2(rsvps.submittedAt)).limit(10);
    const photoStatsResult = await db.select({
      totalPhotos: count(),
      approvedPhotos: sql3`COUNT(CASE WHEN ${guestPhotos.isApproved} = true THEN 1 END)`,
      pendingPhotos: sql3`COUNT(CASE WHEN ${guestPhotos.isApproved} = false THEN 1 END)`
    }).from(guestPhotos).where(eq4(guestPhotos.templateId, templateId));
    const photoStats = photoStatsResult[0];
    const recentPhotos = await db.select({
      id: guestPhotos.id,
      uploaderName: guestPhotos.uploaderName,
      photoUrl: guestPhotos.photoUrl,
      isApproved: guestPhotos.isApproved,
      createdAt: guestPhotos.createdAt
    }).from(guestPhotos).where(eq4(guestPhotos.templateId, templateId)).orderBy(desc2(guestPhotos.createdAt)).limit(6);
    const driveIntegrationResult = await db.select({
      id: googleDriveIntegrations.id,
      folderId: googleDriveIntegrations.folderId,
      folderName: googleDriveIntegrations.folderName,
      folderUrl: googleDriveIntegrations.folderUrl,
      isActive: googleDriveIntegrations.isActive,
      googleDriveFolderId: userAdminPanels.googleDriveFolderId
    }).from(googleDriveIntegrations).innerJoin(userAdminPanels, eq4(googleDriveIntegrations.userAdminPanelId, userAdminPanels.id)).where(
      and4(
        eq4(userAdminPanels.userId, req.user.id),
        eq4(userAdminPanels.templateId, templateId),
        eq4(googleDriveIntegrations.isActive, true)
      )
    ).limit(1);
    const driveIntegration = driveIntegrationResult[0] || null;
    res.json({
      rsvpStats,
      recentRsvps,
      photoStats,
      recentPhotos,
      googleDriveConnected: !!driveIntegration,
      driveIntegration
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});
router2.get("/:templateId/rsvps", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { page = 1, limit = 50, search = "", status = "all" } = req.query;
    let whereConditions = [eq4(rsvps.templateId, templateId)];
    if (search) {
      whereConditions.push(
        sql3`(${rsvps.name} ILIKE ${`%${search}%`} OR ${rsvps.guestEmail} ILIKE ${`%${search}%`})`
      );
    }
    if (status !== "all") {
      if (status === "attending") {
        whereConditions.push(eq4(rsvps.attending, true));
      } else if (status === "not_attending") {
        whereConditions.push(eq4(rsvps.attending, false));
      } else if (status === "pending") {
        whereConditions.push(sql3`${rsvps.attending} IS NULL`);
      }
    }
    const offset = (Number(page) - 1) * Number(limit);
    const rsvpResults = await db.select().from(rsvps).where(and4(...whereConditions)).orderBy(desc2(rsvps.submittedAt)).limit(Number(limit)).offset(offset);
    const countResult = await db.select({ count: count() }).from(rsvps).where(and4(...whereConditions));
    const total = countResult[0].count;
    res.json({
      rsvps: rsvpResults,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error("Get RSVPs error:", error);
    res.status(500).json({ error: "Failed to get RSVPs" });
  }
});
router2.get("/:templateId/rsvps/export", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { format = "excel" } = req.query;
    const rsvpResults = await db.select({
      name: rsvps.name,
      guestEmail: rsvps.guestEmail,
      guestPhone: rsvps.guestPhone,
      attending: rsvps.attending,
      guests: rsvps.guests,
      dietaryRestrictions: rsvps.dietaryRestrictions,
      plusOneName: rsvps.plusOneName,
      specialRequests: rsvps.specialRequests,
      submittedAt: rsvps.submittedAt
    }).from(rsvps).where(eq4(rsvps.templateId, templateId)).orderBy(desc2(rsvps.submittedAt));
    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("RSVPs");
      worksheet.addRow([
        "Name",
        "Email",
        "Phone",
        "Attending",
        "Guest Count",
        "Dietary Restrictions",
        "Plus One",
        "Special Requests",
        "Submitted At"
      ]);
      rsvpResults.forEach((rsvp) => {
        worksheet.addRow([
          rsvp.name,
          rsvp.guestEmail,
          rsvp.guestPhone,
          rsvp.attending ? "Yes" : rsvp.attending === false ? "No" : "Pending",
          rsvp.guests,
          rsvp.dietaryRestrictions,
          rsvp.plusOneName,
          rsvp.specialRequests,
          rsvp.submittedAt
        ]);
      });
      worksheet.getRow(1).font = { bold: true };
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=rsvps-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const csvHeader = "Name,Email,Phone,Attending,Guest Count,Dietary Restrictions,Plus One,Special Requests,Submitted At\n";
      const csvData = rsvpResults.map(
        (rsvp) => `"${rsvp.name}","${rsvp.guestEmail || ""}","${rsvp.guestPhone || ""}","${rsvp.attending ? "Yes" : rsvp.attending === false ? "No" : "Pending"}","${rsvp.guests}","${rsvp.dietaryRestrictions || ""}","${rsvp.plusOneName || ""}","${rsvp.specialRequests || ""}","${rsvp.submittedAt}"`
      ).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=rsvps-${Date.now()}.csv`);
      res.send(csvHeader + csvData);
    }
  } catch (error) {
    console.error("Export RSVPs error:", error);
    res.status(500).json({ error: "Failed to export RSVPs" });
  }
});
router2.get("/:templateId/photos", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { page = 1, limit = 20, status = "all" } = req.query;
    let whereConditions = [eq4(guestPhotos.templateId, templateId)];
    if (status === "approved") {
      whereConditions.push(eq4(guestPhotos.isApproved, true));
    } else if (status === "pending") {
      whereConditions.push(eq4(guestPhotos.isApproved, false));
    }
    const offset = (Number(page) - 1) * Number(limit);
    const photoResults = await db.select().from(guestPhotos).where(and4(...whereConditions)).orderBy(desc2(guestPhotos.createdAt)).limit(Number(limit)).offset(offset);
    const countResult = await db.select({ count: count() }).from(guestPhotos).where(and4(...whereConditions));
    const total = countResult[0].count;
    res.json({
      photos: photoResults,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error("Get photos error:", error);
    res.status(500).json({ error: "Failed to get photos" });
  }
});
router2.put("/:templateId/photos/:photoId", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId, photoId } = req.params;
    const { isApproved, isFeatured } = req.body;
    await db.update(guestPhotos).set({
      isApproved,
      isFeatured: isFeatured || false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and4(
        eq4(guestPhotos.id, photoId),
        eq4(guestPhotos.templateId, templateId)
      )
    );
    await db.insert(activityLogs).values({
      userId: req.user.id,
      templateId,
      action: isApproved ? "approve_photo" : "reject_photo",
      entityType: "guest_photo",
      entityId: photoId,
      details: { isApproved, isFeatured }
    });
    res.json({ message: "Photo status updated successfully" });
  } catch (error) {
    console.error("Update photo status error:", error);
    res.status(500).json({ error: "Failed to update photo status" });
  }
});
router2.delete("/:templateId/photos/:photoId", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId, photoId } = req.params;
    const photoResult = await db.select({ photoUrl: guestPhotos.photoUrl }).from(guestPhotos).where(
      and4(
        eq4(guestPhotos.id, photoId),
        eq4(guestPhotos.templateId, templateId)
      )
    ).limit(1);
    if (photoResult.length === 0) {
      return res.status(404).json({ error: "Photo not found" });
    }
    const photo = photoResult[0];
    await db.delete(guestPhotos).where(
      and4(
        eq4(guestPhotos.id, photoId),
        eq4(guestPhotos.templateId, templateId)
      )
    );
    try {
      const filePath = path.join(process.cwd(), photo.photoUrl);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error("Failed to delete photo file:", fileError);
    }
    await db.insert(activityLogs).values({
      userId: req.user.id,
      templateId,
      action: "delete_photo",
      entityType: "guest_photo",
      entityId: photoId,
      details: { photoUrl: photo.photoUrl }
    });
    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});
router2.post("/:templateId/google-drive/configure", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { folderName, accessType, specialGuestEmails } = req.body;
    if (!folderName) {
      return res.status(400).json({ error: "Folder name is required" });
    }
    const mockFolderId = "gdrive_" + Date.now();
    const mockFolderUrl = `https://drive.google.com/drive/folders/${mockFolderId}`;
    const adminPanelResult = await db.select({ id: userAdminPanels.id }).from(userAdminPanels).where(
      and4(
        eq4(userAdminPanels.userId, req.user.id),
        eq4(userAdminPanels.templateId, templateId)
      )
    ).limit(1);
    if (adminPanelResult.length === 0) {
      return res.status(404).json({ error: "Admin panel not found" });
    }
    const adminPanelId = adminPanelResult[0].id;
    const existingIntegration = await db.select({ id: googleDriveIntegrations.id }).from(googleDriveIntegrations).where(
      and4(
        eq4(googleDriveIntegrations.userAdminPanelId, adminPanelId),
        eq4(googleDriveIntegrations.isActive, true)
      )
    ).limit(1);
    if (existingIntegration.length > 0) {
      await db.update(googleDriveIntegrations).set({
        folderName,
        folderUrl: mockFolderUrl,
        accessType,
        specialGuestEmails: JSON.stringify(specialGuestEmails || []),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq4(googleDriveIntegrations.userAdminPanelId, adminPanelId));
    } else {
      await db.insert(googleDriveIntegrations).values({
        userAdminPanelId: adminPanelId,
        folderId: mockFolderId,
        folderName,
        folderUrl: mockFolderUrl,
        accessType,
        specialGuestEmails: JSON.stringify(specialGuestEmails || [])
      });
    }
    await db.update(userAdminPanels).set({ googleDriveFolderId: mockFolderId }).where(eq4(userAdminPanels.id, adminPanelId));
    res.json({
      message: "Google Drive integration configured successfully",
      folderId: mockFolderId,
      folderUrl: mockFolderUrl
    });
  } catch (error) {
    console.error("Google Drive configuration error:", error);
    res.status(500).json({ error: "Failed to configure Google Drive integration" });
  }
});
router2.get("/:templateId/activity", authenticateUser, requireAdminPanelAccess, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const activityResult = await db.select({
      id: activityLogs.id,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      details: activityLogs.details,
      createdAt: activityLogs.createdAt,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      email: managementUsers.email
    }).from(activityLogs).innerJoin(managementUsers, eq4(activityLogs.userId, managementUsers.id)).where(eq4(activityLogs.templateId, templateId)).orderBy(desc2(activityLogs.createdAt)).limit(Number(limit)).offset(offset);
    const countResult = await db.select({ count: count() }).from(activityLogs).where(eq4(activityLogs.templateId, templateId));
    const total = countResult[0].count;
    res.json({
      activities: activityResult,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({ error: "Failed to get activity logs" });
  }
});
var admin_panel_default = router2;

// server/routes/platform-admin.ts
import express3 from "express";
import { eq as eq5, desc as desc3 } from "drizzle-orm";
var router3 = express3.Router();
router3.get("/ultimate-customers", async (req, res) => {
  try {
    const customers = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      templateId: userAdminPanels.templateId,
      templateSlug: userAdminPanels.templateSlug,
      createdAt: managementUsers.createdAt,
      isActive: userAdminPanels.isActive
    }).from(managementUsers).leftJoin(userAdminPanels, eq5(managementUsers.id, userAdminPanels.userId)).where(eq5(userAdminPanels.isActive, true)).orderBy(desc3(managementUsers.createdAt));
    res.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});
router3.post("/create-ultimate-customer", async (req, res) => {
  try {
    const { email, firstName, lastName, password, templateId, templateSlug } = req.body;
    if (!email || !firstName || !lastName || !password || !templateId || !templateSlug) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const [existingUser] = await db.select().from(managementUsers).where(eq5(managementUsers.email, email));
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    const [existingSlug] = await db.select().from(userAdminPanels).where(eq5(userAdminPanels.templateSlug, templateSlug));
    if (existingSlug) {
      return res.status(400).json({ error: "Template slug is already taken" });
    }
    const hashedPassword = await hashPassword(password);
    const [user] = await db.insert(managementUsers).values({
      email,
      firstName,
      lastName,
      passwordHash: hashedPassword,
      status: "active",
      emailVerified: true
      // Skip email verification for admin-created users
    }).returning();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const [order] = await db.insert(orders).values({
      orderNumber,
      userId: user.id,
      templateId,
      templatePlan: "ultimate",
      amount: "37000.00",
      paymentMethod: "cash",
      status: "completed",
      adminAccessGranted: true
    }).returning();
    await db.insert(userAdminPanels).values({
      userId: user.id,
      templateId,
      templateSlug,
      orderId: order.id,
      isActive: true
    });
    res.json({
      success: true,
      message: "Ultimate customer created successfully",
      customer: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        templateSlug,
        adminUrl: `/${templateSlug}/admin`
      }
    });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});
router3.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const [customer] = await db.select({
      id: managementUsers.id,
      email: managementUsers.email,
      firstName: managementUsers.firstName,
      lastName: managementUsers.lastName,
      status: managementUsers.status,
      createdAt: managementUsers.createdAt,
      templateId: userAdminPanels.templateId,
      templateSlug: userAdminPanels.templateSlug,
      isActive: userAdminPanels.isActive
    }).from(managementUsers).leftJoin(userAdminPanels, eq5(managementUsers.id, userAdminPanels.userId)).where(eq5(managementUsers.id, customerId));
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});
router3.put("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { firstName, lastName, email, isActive } = req.body;
    await db.update(managementUsers).set({ firstName, lastName, email }).where(eq5(managementUsers.id, customerId));
    await db.update(userAdminPanels).set({ isActive }).where(eq5(userAdminPanels.userId, customerId));
    res.json({ success: true, message: "Customer updated successfully" });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});
var platform_admin_default = router3;

// server/routes/templates.ts
import { z as z2 } from "zod";
import multer2 from "multer";
import path2 from "path";
import fs2 from "fs";
function registerTemplateRoutes(app2) {
  app2.get("/api/templates/:identifier/config", async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`Template config request timeout for: ${req.params.identifier}`);
        res.status(408).json({ message: "Request timeout" });
      }
    }, 8e3);
    try {
      const { identifier } = req.params;
      console.log(`\u{1F50D} Searching for template with ID: ${identifier}`);
      let template = await Promise.race([
        storage.getTemplate(identifier),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 5e3))
      ]);
      if (!template) {
        console.log(`\u274C No template found with ID: ${identifier}`);
        console.log(`\u{1F50D} Searching for template with slug: ${identifier}`);
        template = await Promise.race([
          storage.getTemplateBySlug(identifier),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 5e3))
        ]);
      }
      if (!template) {
        clearTimeout(timeoutId);
        return res.status(404).json({ message: "Template not found" });
      }
      console.log(`\u2705 Found template: ${template.name} (ID: ${template.id})`);
      const response = {
        templateId: template.id,
        templateKey: template.templateKey,
        config: template.config,
        maintenance: template.maintenance
      };
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.json(response);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Get template config error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  app2.post("/api/templates/:templateId/rsvp", async (req, res) => {
    try {
      const { templateId } = req.params;
      let template = await storage.getTemplate(templateId);
      if (!template) {
        template = await storage.getTemplateBySlug(templateId);
      }
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      if (template.maintenance) {
        return res.status(503).json({ message: "Template is in maintenance mode" });
      }
      const validatedData = insertRsvpSchema.parse({
        ...req.body,
        templateId: template.id,
        // Use the actual template ID, not the slug
        guestEmail: req.body.guestEmail || req.body.email
        // Ensure guestEmail is filled from email if not provided
      });
      const emailToCheck = validatedData.guestEmail || validatedData.email;
      const existingRsvp = await storage.getRsvpByEmail(emailToCheck, template.id);
      if (existingRsvp) {
        return res.status(400).json({
          message: "\u0531\u0575\u057D \u0567\u056C\u2024 \u0570\u0561\u057D\u0581\u0565\u0578\u057E \u0561\u0580\u0564\u0565\u0576 \u0578\u0582\u0572\u0561\u0580\u056F\u057E\u0565\u056C \u0567 \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574"
        });
      }
      const rsvp = await storage.createRsvp(validatedData);
      try {
        const config = template.config;
        if (config.email?.recipients || config.couple) {
          await Promise.all([
            sendTemplateRsvpNotificationEmails(rsvp, template),
            sendTemplateRsvpConfirmationEmail(rsvp, template)
          ]);
        }
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }
      res.json({
        message: "\u0547\u0576\u0578\u0580\u0570\u0561\u056F\u0561\u056C\u0578\u0582\u0569\u0575\u0578\u0582\u0576! \u0541\u0565\u0580 \u0570\u0561\u057D\u057F\u0561\u057F\u0578\u0582\u0574\u0568 \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567:",
        rsvp: {
          id: rsvp.id,
          firstName: rsvp.firstName,
          lastName: rsvp.lastName,
          attendance: rsvp.attendance
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "\u054F\u057E\u0575\u0561\u056C\u0576\u0565\u0580\u0568 \u0573\u056B\u0577\u057F \u0579\u0565\u0576 \u056C\u0580\u0561\u0581\u057E\u0561\u056E",
          errors: error.errors
        });
      }
      console.error("RSVP submission error:", error);
      res.status(500).json({ message: "\u054D\u0565\u0580\u057E\u0565\u0580\u056B \u057D\u056D\u0561\u056C" });
    }
  });
  app2.get("/api/templates/:templateId/rsvps", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      let template = await storage.getTemplate(templateId);
      if (!template) {
        template = await storage.getTemplateBySlug(templateId);
      }
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const rsvps2 = await storage.getAllRsvps(template.id);
      res.json(rsvps2);
    } catch (error) {
      console.error("Get template RSVPs error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  const uploadsDir2 = process.env.VERCEL ? "/tmp/uploads" : path2.join(process.cwd(), "uploads");
  if (!fs2.existsSync(uploadsDir2)) {
    fs2.mkdirSync(uploadsDir2, { recursive: true });
  }
  const templateUpload = multer2({
    storage: multer2.diskStorage({
      destination: (req, file, cb) => {
        const { templateId } = req.params;
        const templateUploadsDir = path2.join(uploadsDir2, templateId);
        if (!fs2.existsSync(templateUploadsDir)) {
          fs2.mkdirSync(templateUploadsDir, { recursive: true });
        }
        cb(null, templateUploadsDir);
      },
      filename: (req, file, cb) => {
        const { templateId } = req.params;
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path2.extname(file.originalname);
        cb(null, `${templateId}-${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024
      // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed!"), false);
      }
    }
  });
  app2.post("/api/templates/:templateId/photos/upload", authenticateUser, requireAdminPanelAccess, templateUpload.single("image"), async (req, res) => {
    try {
      console.log("\u{1F527} Photo upload endpoint hit, templateId:", req.params.templateId);
      console.log("\u{1F527} File received:", !!req.file);
      console.log("\u{1F527} Body:", req.body);
      const { templateId } = req.params;
      if (!req.file) {
        console.log("\u274C No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
      }
      console.log("\u{1F4C1} File details:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });
      const template = await storage.getTemplate(templateId);
      if (!template) {
        console.log("\u274C Template not found:", templateId);
        return res.status(404).json({ message: "Template not found" });
      }
      console.log("\u2705 Template found:", template.name);
      const { category = "gallery" } = req.body;
      let imageUrl = `/api/images/serve/${req.file.filename}`;
      let useR2 = false;
      if (process.env.VERCEL) {
        try {
          if (process.env.CLOUDFLARE_R2_BUCKET_NAME && process.env.CLOUDFLARE_R2_ACCOUNT_ID && process.env.CLOUDFLARE_R2_ACCESS_KEY && process.env.CLOUDFLARE_R2_SECRET_KEY && process.env.CLOUDFLARE_R2_PUBLIC_URL) {
            const { r2Storage: r2Storage2 } = await Promise.resolve().then(() => (init_r2Storage(), r2Storage_exports));
            if (r2Storage2.isConfigured()) {
              const fileBuffer = fs2.readFileSync(req.file.path);
              const r2Result = await r2Storage2.uploadImage(
                templateId,
                fileBuffer,
                req.file.originalname,
                req.file.mimetype,
                category
              );
              imageUrl = r2Result.url;
              console.log(`\u2601\uFE0F Image uploaded to R2: ${r2Result.url}`);
              useR2 = true;
              fs2.unlinkSync(req.file.path);
            }
          } else {
            console.log("\u26A0\uFE0F R2 environment variables not fully configured, using local storage");
          }
        } catch (r2Error) {
          console.warn("\u26A0\uFE0F R2 upload failed, using local storage:", r2Error);
        }
      }
      if (!useR2) {
        imageUrl = `/api/images/serve/${req.file.filename}`;
        console.log(`\u{1F4BE} Using local storage with API serve: ${imageUrl}`);
      }
      console.log("\u{1F4BE} Creating image record in database...");
      const imageRecord = await storage.createImage({
        templateId,
        url: imageUrl,
        name: req.file.originalname,
        category,
        size: req.file.size.toString(),
        mimeType: req.file.mimetype,
        order: "0"
      });
      console.log(`\u{1F4F8} Template-scoped image uploaded: ${req.file.filename} for template ${templateId}`);
      const response = {
        id: imageRecord.id,
        url: imageUrl,
        name: req.file.originalname,
        size: req.file.size,
        category,
        templateId
      };
      console.log("\u{1F4E4} Sending response:", response);
      res.json(response);
    } catch (error) {
      console.error("\u{1F4A5} Template photo upload error:", error);
      console.error("\u{1F4A5} Error stack:", error instanceof Error ? error.stack : "No stack trace");
      if (req.file && req.file.path) {
        try {
          fs2.unlinkSync(req.file.path);
          console.log("\u{1F9F9} Cleaned up uploaded file");
        } catch (cleanupError) {
          console.error("\u{1F9F9} Failed to cleanup file:", cleanupError);
        }
      }
      res.setHeader("Content-Type", "application/json");
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred during upload";
      const errorResponse = {
        success: false,
        error: "Image upload failed",
        message: errorMessage,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("\u{1F4E4} Sending error response:", errorResponse);
      res.status(500).json(errorResponse);
    }
  });
  app2.post("/api/templates/:templateId/maintenance", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      const { enabled } = req.body;
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      await storage.setMaintenanceStatus(enabled, templateId);
      res.json({
        message: enabled ? "Template maintenance enabled" : "Template maintenance disabled",
        enabled,
        templateId
      });
    } catch (error) {
      console.error("Template maintenance toggle error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/templates/:templateId/images", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId } = req.params;
      const { category } = req.query;
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const images2 = await storage.getImages(templateId, category);
      console.log(`\u{1F4F7} Retrieved ${images2.length} images for template ${templateId}${category ? ` (category: ${category})` : ""}`);
      res.json(images2);
    } catch (error) {
      console.error("Template images listing error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.delete("/api/templates/:templateId/images/:imageId", authenticateUser, requireAdminPanelAccess, async (req, res) => {
    try {
      const { templateId, imageId } = req.params;
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const success = await storage.deleteImage(imageId);
      if (success) {
        console.log(`\u{1F5D1}\uFE0F Deleted image ${imageId} for template ${templateId}`);
        res.json({ success: true, message: "Image deleted successfully" });
      } else {
        res.status(404).json({ message: "Image not found" });
      }
    } catch (error) {
      console.error("Template image deletion error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}

// server/routes.ts
var uploadsDir = process.env.VERCEL ? "/tmp/uploads" : path3.join(process.cwd(), "uploads");
if (!fs3.existsSync(uploadsDir)) {
  fs3.mkdirSync(uploadsDir, { recursive: true });
}
var multerStorage = multer3.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path3.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});
var upload2 = multer3({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});
async function registerRoutes(app2) {
  app2.get("/api/test-static", (req, res) => {
    console.log("\u{1F527} Test static route accessed");
    res.json({ message: "Express static route working", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/manifest.json", (req, res) => {
    console.log("\u{1F527} Manifest.json requested - serving directly from Express");
    try {
      const manifestPath = path3.join(process.cwd(), "dist/public/manifest.json");
      console.log(`\u{1F4C1} Looking for manifest at: ${manifestPath}`);
      if (fs3.existsSync(manifestPath)) {
        console.log("\u2705 Manifest found, serving file");
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.sendFile(manifestPath);
      } else {
        console.log("\u274C Manifest not found at path");
        res.status(404).json({ error: "Manifest not found" });
      }
    } catch (error) {
      console.error("\u{1F4A5} Error serving manifest:", error);
      res.status(500).json({ error: "Failed to serve manifest" });
    }
  });
  app2.get("/favicon.png", (req, res) => {
    try {
      const faviconPath = path3.join(process.cwd(), "dist/public/favicon.png");
      if (fs3.existsSync(faviconPath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.sendFile(faviconPath);
      } else {
        res.status(404).send("Favicon not found");
      }
    } catch (error) {
      res.status(500).send("Failed to serve favicon");
    }
  });
  app2.use("/api/auth", auth_default);
  app2.use("/api/admin-panel", admin_panel_default);
  app2.use("/api/platform-admin", platform_admin_default);
  registerTemplateRoutes(app2);
  app2.post("/api/rsvp", async (req, res) => {
    try {
      const templateId = req.body.templateId || "default-harut-tatev";
      return res.status(301).json({
        message: "Please use template-specific RSVP endpoint",
        redirectTo: `/api/templates/${templateId}/rsvp`
      });
    } catch (error) {
      console.error("Legacy RSVP endpoint error:", error);
      res.status(500).json({ message: "\u054D\u0565\u0580\u057E\u0565\u0580\u056B \u057D\u056D\u0561\u056C" });
    }
  });
  app2.get("/api/rsvps", async (req, res) => {
    try {
      const rsvps2 = await storage.getAllRsvps();
      res.json(rsvps2);
    } catch (error) {
      console.error("Get RSVPs error:", error);
      res.status(500).json({ message: "\u054D\u0565\u0580\u057E\u0565\u0580\u056B \u057D\u056D\u0561\u056C" });
    }
  });
  app2.get("/api/test-email", async (req, res) => {
    try {
      console.log("\u{1F9EA} Testing email service...");
      await testEmailService();
      res.json({ message: "Email test initiated. Check logs for results." });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ message: "Email test failed" });
    }
  });
  app2.get("/api/maintenance", async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error("Maintenance status request timeout");
        res.status(408).json({ message: "Request timeout", enabled: false });
      }
    }, 5e3);
    try {
      console.log(`\u{1F527} Checking maintenance status - DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
      const status = await Promise.race([
        storage.getMaintenanceStatus(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 3e3))
      ]);
      console.log(`\u2705 Maintenance status retrieved: ${status}`);
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.json({ enabled: status });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("\u274C Get maintenance status error details:", error);
      console.error("\u274C Error stack:", error instanceof Error ? error.stack : "No stack available");
      console.error("\u274C Database URL available:", !!process.env.DATABASE_URL);
      if (!res.headersSent) {
        res.json({
          enabled: false,
          // Safe default
          warning: "Database unavailable, using fallback"
        });
      }
    }
  });
  app2.post("/api/maintenance", async (req, res) => {
    try {
      const { enabled, password } = req.body;
      if (password !== "haruttev2025admin") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await storage.setMaintenanceStatus(enabled);
      res.json({
        message: enabled ? "Maintenance mode enabled" : "Maintenance mode disabled",
        enabled
      });
    } catch (error) {
      console.error("Set maintenance status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/photos/upload", upload2.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { templateId, category = "gallery" } = req.body;
      if (!templateId) {
        return res.status(400).json({ error: "Template ID is required" });
      }
      console.log("\u{1F4F8} Gallery photo upload started:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        templateId,
        category
      });
      let imageUrl = `/api/images/serve/${req.file.filename}`;
      let useR2 = false;
      if (process.env.VERCEL) {
        try {
          if (process.env.CLOUDFLARE_R2_BUCKET_NAME && process.env.CLOUDFLARE_R2_ACCOUNT_ID && process.env.CLOUDFLARE_R2_ACCESS_KEY && process.env.CLOUDFLARE_R2_SECRET_KEY && process.env.CLOUDFLARE_R2_PUBLIC_URL) {
            const { r2Storage: r2Storage2 } = await Promise.resolve().then(() => (init_r2Storage(), r2Storage_exports));
            if (r2Storage2.isConfigured()) {
              const fileBuffer = fs3.readFileSync(req.file.path);
              const r2Result = await r2Storage2.uploadImage(
                templateId,
                fileBuffer,
                req.file.originalname,
                req.file.mimetype,
                category
              );
              imageUrl = r2Result.url;
              console.log(`\u2601\uFE0F Gallery image uploaded to R2: ${r2Result.url}`);
              useR2 = true;
              fs3.unlinkSync(req.file.path);
            }
          } else {
            console.log("\u26A0\uFE0F R2 environment variables not configured for gallery upload");
          }
        } catch (r2Error) {
          console.warn("\u26A0\uFE0F R2 gallery upload failed, using local storage:", r2Error);
        }
      }
      const imageRecord = await storage.createImage({
        templateId,
        url: imageUrl,
        name: req.file.originalname,
        category,
        size: req.file.size.toString(),
        mimeType: req.file.mimetype,
        order: "0"
      });
      console.log(`\u2705 Gallery image upload complete: ${req.file.filename} for template ${templateId}, R2: ${useR2}`);
      res.json({
        id: imageRecord.id,
        url: imageUrl,
        name: req.file.originalname,
        size: req.file.size,
        category,
        templateId
      });
    } catch (error) {
      console.error("\u{1F4A5} Gallery photo upload error:", error);
      console.error("\u{1F4A5} Error stack:", error instanceof Error ? error.stack : "No stack trace");
      if (req.file && req.file.path) {
        try {
          fs3.unlinkSync(req.file.path);
          console.log("\u{1F9F9} Cleaned up gallery upload file");
        } catch (cleanupError) {
          console.error("\u{1F9F9} Failed to cleanup gallery file:", cleanupError);
        }
      }
      res.setHeader("Content-Type", "application/json");
      const errorResponse = {
        success: false,
        error: "Gallery photo upload failed",
        message: error instanceof Error ? error.message : "Unknown error during gallery upload",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("\u{1F4E4} Sending gallery error response:", errorResponse);
      res.status(500).json(errorResponse);
    }
  });
  app2.post("/api/images/upload", upload2.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { templateId, category = "gallery" } = req.body;
      if (!templateId) {
        return res.status(400).json({ error: "Template ID is required" });
      }
      const imageUrl = `/api/images/serve/${req.file.filename}`;
      const imageRecord = await storage.createImage({
        templateId,
        url: imageUrl,
        name: req.file.originalname,
        category,
        size: req.file.size.toString(),
        mimeType: req.file.mimetype,
        order: "0"
      });
      console.log(`\u{1F4F8} Image uploaded successfully: ${req.file.filename} for template ${templateId}`);
      res.json({
        id: imageRecord.id,
        url: imageUrl,
        name: req.file.originalname,
        size: req.file.size,
        category
      });
    } catch (error) {
      console.error("\u{1F4A5} Legacy image upload error:", error);
      console.error("\u{1F4A5} Error stack:", error instanceof Error ? error.stack : "No stack trace");
      if (req.file && req.file.path) {
        try {
          fs3.unlinkSync(req.file.path);
          console.log("\u{1F9F9} Cleaned up legacy upload file");
        } catch (cleanupError) {
          console.error("\u{1F9F9} Failed to cleanup legacy file:", cleanupError);
        }
      }
      res.setHeader("Content-Type", "application/json");
      const errorResponse = {
        success: false,
        error: "Image upload failed",
        message: error instanceof Error ? error.message : "Unknown error during image upload",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("\u{1F4E4} Sending legacy error response:", errorResponse);
      res.status(500).json(errorResponse);
    }
  });
  app2.get("/api/images/serve/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const templateMatch = filename.match(/^([a-f0-9-]{36})-/);
      let filePath;
      if (templateMatch) {
        const templateId = templateMatch[1];
        const baseUploadsDir = process.env.VERCEL ? "/tmp/uploads" : path3.join(process.cwd(), "uploads");
        filePath = path3.join(baseUploadsDir, templateId, filename);
      } else {
        const baseUploadsDir = process.env.VERCEL ? "/tmp/uploads" : path3.join(process.cwd(), "uploads");
        filePath = path3.join(baseUploadsDir, filename);
      }
      if (!fs3.existsSync(filePath)) {
        console.log(`\u26A0\uFE0F Image not found at ${filePath}, serving placeholder`);
        const possiblePaths = [
          path3.join(process.cwd(), "attached_assets", "default-wedding-couple.jpg"),
          path3.join(process.cwd(), "dist", "attached_assets", "default-wedding-couple.jpg"),
          path3.join(process.cwd(), "dist/attached_assets/default-wedding-couple.jpg")
        ];
        let placeholderPath = null;
        for (const possiblePath of possiblePaths) {
          if (fs3.existsSync(possiblePath)) {
            placeholderPath = possiblePath;
            console.log(`\u2705 Found placeholder at: ${possiblePath}`);
            break;
          } else {
            console.log(`\u274C No placeholder at: ${possiblePath}`);
          }
        }
        if (placeholderPath) {
          const ext2 = path3.extname(placeholderPath).toLowerCase();
          const contentType2 = ext2 === ".jpg" || ext2 === ".jpeg" ? "image/jpeg" : ext2 === ".png" ? "image/png" : ext2 === ".webp" ? "image/webp" : "image/jpeg";
          res.setHeader("Content-Type", contentType2);
          res.setHeader("Cache-Control", "public, max-age=86400");
          return res.sendFile(placeholderPath);
        }
        return res.status(404).json({ error: "Image not found and no placeholder available" });
      }
      const ext = path3.extname(filename).toLowerCase();
      const contentTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif"
      };
      const contentType = contentTypes[ext] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      const stream = fs3.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });
  app2.get("/api/images", async (req, res) => {
    try {
      const { templateId, category } = req.query;
      if (!templateId) {
        return res.status(400).json({ error: "Template ID is required" });
      }
      console.log(`\u{1F4F8} Getting images for template: ${templateId}, category: ${category || "all"}`);
      const images2 = await storage.getImages(templateId, category);
      console.log(`\u{1F4CA} Found ${images2.length} images`);
      res.json(images2);
    } catch (error) {
      console.error("\u274C Failed to get images:", error);
      res.status(500).json({ error: "Failed to get images" });
    }
  });
  app2.get("/api/images/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const { category } = req.query;
      console.log(`\u{1F4F8} Getting images for template: ${templateId}, category: ${category || "all"}`);
      const images2 = await storage.getImages(templateId, category);
      console.log(`\u{1F4CA} Found ${images2.length} images`);
      res.json(images2);
    } catch (error) {
      console.error("\u274C Failed to get images:", error);
      res.status(500).json({ error: "Failed to get images" });
    }
  });
  app2.delete("/api/images", async (req, res) => {
    try {
      const { id, templateId } = req.body;
      if (!id || !templateId) {
        return res.status(400).json({ error: "Image ID and template ID are required" });
      }
      console.log(`\u{1F5D1}\uFE0F Deleting image: ${id} for template ${templateId}`);
      const images2 = await storage.getImages(templateId);
      const imageRecord = images2.find((img) => img.id === id);
      if (imageRecord) {
        await storage.deleteImage(imageRecord.id);
        const filename = imageRecord.url.split("/").pop();
        if (filename) {
          const baseUploadsDir = process.env.VERCEL ? "/tmp/uploads" : path3.join(process.cwd(), "uploads");
          const filePath = path3.join(baseUploadsDir, filename);
          if (fs3.existsSync(filePath)) {
            fs3.unlinkSync(filePath);
            console.log(`\u{1F5D1}\uFE0F Deleted file: ${filename}`);
          }
        }
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(404).json({ error: "Image not found" });
      }
    } catch (error) {
      console.error("\u274C Failed to delete image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });
  app2.get("/api/images/template-preview-:id.jpg", async (req, res) => {
    try {
      const { id } = req.params;
      const filename = `template-preview-${id}.jpg`;
      const filePath = path3.join(process.cwd(), "attached_assets", "template_previews", filename);
      if (!fs3.existsSync(filePath)) {
        return res.status(404).json({ error: "Template preview image not found" });
      }
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      const stream = fs3.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error("Error serving template preview image:", error);
      res.status(500).json({ error: "Failed to serve template preview image" });
    }
  });
  app2.get("/api/assets/:filename", async (req, res) => {
    const { filename } = req.params;
    res.redirect(301, `/attached_assets/${filename}`);
  });
  app2.get("/api/templates", async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error("Templates list request timeout");
        res.status(408).json({ error: "Request timeout" });
      }
    }, 6e3);
    try {
      console.log(`\u{1F4CB} Getting all templates`);
      const templates4 = await Promise.race([
        storage.getAllTemplates(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 4e3))
      ]);
      console.log(`\u{1F4CA} Found ${templates4.length} templates`);
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        res.json(templates4);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("\u274C Failed to get templates:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to get templates" });
      }
    }
  });
  app2.get("/api/templates/:identifier/config", async (req, res) => {
    try {
      const { identifier } = req.params;
      console.log(`\u{1F4CB} Getting template config for: ${identifier}`);
      const sanitizedIdentifier = identifier.replace(/[^a-zA-Z0-9-_]/g, "");
      if (!sanitizedIdentifier) {
        return res.status(400).json({ message: "Invalid template identifier" });
      }
      let template = await storage.getTemplate(sanitizedIdentifier);
      if (!template) {
        console.log(`\u{1F4CB} Template not found by ID, trying slug: ${sanitizedIdentifier}`);
        template = await storage.getTemplateBySlug(sanitizedIdentifier);
      }
      if (!template) {
        console.log(`\u274C Template not found: ${sanitizedIdentifier}`);
        return res.status(404).json({
          message: "Template not found",
          identifier: sanitizedIdentifier
        });
      }
      if (template.maintenance) {
        const maintenanceConfig = template.config.maintenance || {};
        return res.json({
          templateId: template.id,
          templateKey: template.templateKey,
          maintenance: true,
          maintenanceConfig: {
            title: maintenanceConfig.title || "Site Under Maintenance",
            message: maintenanceConfig.message || "We will be back soon",
            enabled: true
          }
        });
      }
      console.log(`\u2705 Template found: ${template.name} (${template.id})`);
      let allImages = [];
      try {
        allImages = await storage.getImages(template.id);
      } catch (imageError) {
        console.warn(`\u26A0\uFE0F Could not load images for template ${template.id}:`, imageError);
      }
      const heroImages = allImages.filter((img) => img.category === "hero").map((img) => img.url);
      const galleryImages = allImages.filter((img) => img.category === "gallery").map((img) => img.url);
      const config = template.config;
      const enrichedConfig = {
        ...config,
        hero: {
          ...config.hero,
          images: heroImages.length > 0 ? heroImages : config.hero?.images || []
        },
        photos: {
          ...config.photos,
          images: galleryImages.length > 0 ? galleryImages : config.photos?.images || []
        }
      };
      const templateInfo = {
        templateId: template.id,
        templateKey: template.templateKey,
        slug: template.slug,
        config: enrichedConfig,
        maintenance: false
      };
      res.setHeader("Cache-Control", "public, max-age=300");
      console.log(`\u2705 Template config loaded: ${heroImages.length} hero, ${galleryImages.length} gallery images`);
      res.json(templateInfo);
    } catch (error) {
      console.error("\u274C Get template config error:", error);
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : "Internal server error"
      });
    }
  });
  app2.put("/api/templates/:templateId/config", async (req, res) => {
    try {
      const { templateId } = req.params;
      const config = req.body;
      console.log(`\u{1F4BE} Saving template config for: ${templateId}`);
      console.log(`\u{1F4BE} Config data:`, JSON.stringify(config, null, 2));
      let template = await storage.getTemplate(templateId);
      if (!template) {
        console.log(`\u274C Template not found by ID, trying slug: ${templateId}`);
        template = await storage.getTemplateBySlug(templateId);
      }
      if (!template) {
        console.log(`\u274C Template not found by ID or slug: ${templateId}`);
        return res.status(404).json({ message: "Template not found" });
      }
      const updatedTemplate = await storage.updateTemplate(template.id, { config });
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      console.log(`\u2705 Template config saved successfully`);
      res.json(updatedTemplate.config);
    } catch (error) {
      console.error("Save template config error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/templates/:templateId/rsvps", async (req, res) => {
    try {
      const { templateId } = req.params;
      console.log(`\u{1F4CB} Getting RSVPs for template: ${templateId}`);
      let template = await storage.getTemplate(templateId);
      if (!template) {
        console.log(`\u274C Template not found by ID, trying slug: ${templateId}`);
        template = await storage.getTemplateBySlug(templateId);
      }
      if (!template) {
        console.log(`\u274C Template not found by ID or slug: ${templateId}`);
        return res.status(404).json({ message: "Template not found" });
      }
      const rsvps2 = await storage.getAllRsvps(template.id);
      console.log(`\u{1F4CA} Found ${rsvps2.length} RSVPs for template`);
      res.json(rsvps2);
    } catch (error) {
      console.error("\u274C Failed to get RSVPs:", error);
      res.status(500).json({ error: "Failed to get RSVPs" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/routes/admin.ts
import { z as z3 } from "zod";
import jwt2 from "jsonwebtoken";
var authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const decoded = jwt2.verify(token, process.env.JWT_SECRET || "fallback-secret");
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
function registerAdminRoutes(app2) {
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "haruttev2025admin";
      if (username !== adminUsername || password !== adminPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt2.sign(
        { username, role: "admin" },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "24h" }
      );
      res.json({
        message: "Login successful",
        token,
        admin: { username }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/admin/templates", authenticateAdmin, async (req, res) => {
    try {
      const templates4 = await storage.getAllTemplates();
      const templatesWithStats = await Promise.all(
        templates4.map(async (template) => {
          const rsvps2 = await storage.getAllRsvps(template.id);
          const attendingCount = rsvps2.filter((r) => r.attendance === "attending").length;
          const notAttendingCount = rsvps2.filter((r) => r.attendance === "not-attending").length;
          return {
            ...template,
            stats: {
              totalRsvps: rsvps2.length,
              attending: attendingCount,
              notAttending: notAttendingCount
            }
          };
        })
      );
      res.json(templatesWithStats);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin/templates", authenticateAdmin, async (req, res) => {
    try {
      console.log("\u{1F50D} Creating template with body:", JSON.stringify(req.body, null, 2));
      const { sourceTemplateId, templateKey: requestedTemplateKey, name, slug, ownerEmail } = req.body;
      let config = {};
      let templateKey = requestedTemplateKey;
      let isMain = true;
      if (sourceTemplateId) {
        console.log("\u{1F504} Cloning from template:", sourceTemplateId);
        isMain = false;
        const sourceTemplate = await storage.getTemplate(sourceTemplateId);
        if (!sourceTemplate) {
          return res.status(404).json({ message: "Source template not found" });
        }
        config = sourceTemplate.config;
        if (!templateKey) {
          templateKey = sourceTemplate.templateKey;
        }
        console.log("\u{1F4CB} Using config from source, templateKey:", templateKey);
      } else if (templateKey) {
        try {
          let templateConfigModule;
          switch (templateKey) {
            case "pro":
              templateConfigModule = await Promise.resolve().then(() => (init_config(), config_exports));
              break;
            case "classic":
              templateConfigModule = await Promise.resolve().then(() => (init_config2(), config_exports2));
              break;
            case "elegant":
              templateConfigModule = await Promise.resolve().then(() => (init_config3(), config_exports3));
              break;
            case "romantic":
              templateConfigModule = await Promise.resolve().then(() => (init_config4(), config_exports4));
              break;
            case "nature":
              templateConfigModule = await Promise.resolve().then(() => (init_config5(), config_exports5));
              break;
            default:
              return res.status(400).json({ message: "Unknown template key" });
          }
          config = templateConfigModule.defaultConfig;
          console.log(`\u{1F4CB} Loaded complete default config for ${templateKey}:`, Object.keys(config));
        } catch (importError) {
          console.error(`Failed to load template config for ${templateKey}:`, importError);
          config = {
            couple: { groomName: "", brideName: "", combinedNames: "" },
            wedding: { date: "", displayDate: "", month: "", day: "" },
            hero: { welcomeMessage: "", musicButton: "Play Music" },
            countdown: {
              subtitle: "Time until our wedding",
              labels: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" }
            },
            calendar: {
              title: "Calendar",
              description: "Join us for our special day",
              monthTitle: "Wedding Month",
              dayLabels: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
            },
            locations: {
              sectionTitle: "Locations",
              church: { title: "Ceremony", name: "Church", description: "Wedding ceremony", mapButton: "Map" },
              restaurant: { title: "Reception", name: "Reception Hall", description: "Celebration", mapButton: "Map" }
            },
            timeline: {
              title: "Timeline",
              events: [
                { time: "16:00", title: "Ceremony", description: "Wedding ceremony" },
                { time: "18:00", title: "Reception", description: "Celebration" },
                { time: "23:00", title: "End", description: "Thank you for celebrating" }
              ],
              afterMessage: { thankYou: "Thank you", notes: "Looking forward to celebrating with you" }
            },
            rsvp: {
              title: "RSVP",
              description: "Please confirm your attendance",
              form: {
                firstName: "First Name",
                firstNamePlaceholder: "Your first name",
                lastName: "Last Name",
                lastNamePlaceholder: "Your last name",
                email: "Email",
                emailPlaceholder: "your@email.com",
                guestCount: "Guest Count",
                guestCountPlaceholder: "Number of guests",
                guestNames: "Guest Names",
                guestNamesPlaceholder: "Names of all guests",
                attendance: "Attendance",
                attendingYes: "Attending",
                attendingNo: "Not Attending",
                submitButton: "Submit RSVP",
                submittingButton: "Submitting..."
              },
              guestOptions: [
                { value: "1", label: "1 guest" },
                { value: "2", label: "2 guests" },
                { value: "3", label: "3 guests" }
              ]
            },
            photos: {
              title: "Photos",
              description: "Share your photos with us",
              downloadButton: "Download Photos",
              uploadButton: "Upload Photos",
              comingSoonMessage: "Photos will be available after the wedding"
            },
            navigation: {
              home: "Home",
              countdown: "Countdown",
              calendar: "Calendar",
              locations: "Locations",
              timeline: "Timeline",
              rsvp: "RSVP"
            },
            footer: { thankYouMessage: "Thank you for celebrating with us" },
            email: { recipients: [] },
            maintenance: {
              enabled: false,
              password: "",
              title: "Coming Soon",
              subtitle: "",
              message: "",
              countdownText: "Until the wedding",
              passwordPrompt: "",
              wrongPassword: "Wrong password",
              enterPassword: "Enter password"
            },
            sections: {
              hero: { enabled: true },
              countdown: { enabled: true },
              calendar: { enabled: true },
              locations: { enabled: true },
              timeline: { enabled: true },
              rsvp: { enabled: true },
              photos: { enabled: true }
            },
            theme: {
              colors: {
                primary: templateKey === "nature" ? "#166534" : templateKey === "elegant" ? "#1e3a8a" : templateKey === "romantic" ? "#9f1239" : "#831843",
                secondary: templateKey === "nature" ? "#15803d" : templateKey === "elegant" ? "#475569" : templateKey === "romantic" ? "#be123c" : "#be185d",
                accent: templateKey === "nature" ? "#a3a3a3" : templateKey === "elegant" ? "#94a3b8" : templateKey === "romantic" ? "#a855f7" : "#6366f1",
                background: templateKey === "nature" ? "#f7f8f7" : templateKey === "elegant" ? "#f1f5f9" : templateKey === "romantic" ? "#fdf2f8" : "#fef7ff"
              },
              fonts: { heading: "Noto Serif Armenian, serif", body: "Noto Sans Armenian, sans-serif" }
            }
          };
        }
      } else {
        return res.status(400).json({ message: "Either sourceTemplateId or templateKey required" });
      }
      const templateData = {
        name: name || `New Template`,
        slug: slug || `template-${Date.now()}`,
        templateKey: templateKey || "pro",
        config,
        maintenance: false,
        sourceTemplateId,
        isMain
      };
      if (ownerEmail) {
        templateData.ownerEmail = ownerEmail;
      }
      console.log("\u{1F4DD} Template data to validate:", JSON.stringify(templateData, null, 2));
      const validatedData = insertTemplateSchema.parse(templateData);
      const newTemplate = await storage.createTemplate(validatedData);
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error("Template creation validation error:", error.errors);
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Create template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.put("/api/admin/templates/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateTemplateSchema.parse(req.body);
      const updatedTemplate = await storage.updateTemplate(id, updates);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      console.error("Update template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.delete("/api/admin/templates/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/admin/templates/:id/export/csv", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const rsvps2 = await storage.getAllRsvps(id);
      const csvHeader = "First Name,Last Name,Email,Guest Count,Guest Names,Attendance,Submitted At\n";
      const csvRows = rsvps2.map(
        (rsvp) => `"${rsvp.firstName}","${rsvp.lastName}","${rsvp.email}","${rsvp.guestCount}","${rsvp.guestNames || ""}","${rsvp.attendance}","${rsvp.createdAt}"`
      ).join("\n");
      const csv = csvHeader + csvRows;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${template.slug}-rsvps.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/admin/templates/:id/images", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const images2 = [
        {
          id: "img-1",
          url: "/api/photos/example1.jpg",
          name: "Hero Image",
          size: 1024e3,
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          category: "hero"
        }
      ];
      res.json(images2);
    } catch (error) {
      console.error("Get template images error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/admin/templates/:id/images", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl, name, category } = req.body;
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const imageRecord = {
        id: `img-${Date.now()}`,
        url: imageUrl,
        name: name || "Uploaded Image",
        category: category || "gallery",
        templateId: id,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(201).json(imageRecord);
    } catch (error) {
      console.error("Upload template image error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.delete("/api/admin/templates/:id/images/:imageId", authenticateAdmin, async (req, res) => {
    try {
      const { id, imageId } = req.params;
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Delete template image error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.put("/api/admin/templates/:id/sections", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { sections } = req.body;
      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const updatedConfig = {
        ...template.config,
        sections
      };
      await storage.updateTemplate(id, { config: updatedConfig });
      res.json({
        message: "Template sections updated successfully",
        sections
      });
    } catch (error) {
      console.error("Update template sections error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
}

// server/index.ts
import path6 from "path";
var log2 = (message) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
};
function validateEnvironment() {
  const requiredEnvVars = ["PORT"];
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(", ")}. Using defaults where possible.`);
  }
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
  }
  return {
    port: parseInt(process.env.PORT || "5001", 10),
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === "production"
  };
}
var app = express5();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
      return;
    }
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });
}
app.use(express5.json({ limit: "10mb" }));
app.use(express5.urlencoded({ extended: false, limit: "10mb" }));
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV || "production",
    version: "1.0.0"
  });
});
app.get("/api/test", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + "..."
  });
});
app.use((req, res, next) => {
  const start = Date.now();
  const path7 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path7.startsWith("/api")) {
      let logLine = `${req.method} ${path7} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const env = validateEnvironment();
    const server = await registerRoutes(app);
    registerAdminRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("Server error:", err);
    });
    if (env.nodeEnv === "development") {
      const { setupVite: setupVite2 } = await init_vite().then(() => vite_exports);
      await setupVite2(app, server);
    } else {
      if (!process.env.VERCEL) {
        const staticPath = path6.join(process.cwd(), "dist/public");
        app.use(express5.static(staticPath));
        app.get("*", (_req, res) => {
          res.sendFile(path6.join(staticPath, "index.html"));
        });
      }
    }
    const startServer = () => {
      return new Promise((resolve, reject) => {
        const serverInstance = server.listen(env.port, "0.0.0.0", () => {
          log2(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
          resolve();
        });
        serverInstance.on("error", (error) => {
          if (error.code === "EADDRINUSE") {
            reject(new Error(`Port ${env.port} is already in use`));
          } else {
            reject(error);
          }
        });
        const timeoutId = setTimeout(() => {
          reject(new Error("Server startup timeout"));
        }, 15e3);
        serverInstance.on("listening", () => {
          clearTimeout(timeoutId);
        });
      });
    };
    await startServer();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
