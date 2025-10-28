import { v2 as cloudinary } from "cloudinary";

console.log(process.env.CLOUDINARY_API_SECRET!);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadImageToCloudinary = async (
  base64: string,
  foldername: string
) => {
  const res = await cloudinary.uploader.upload(base64, {
    folder: foldername,
    resource_type: "image",
  });
  return { url: res.secure_url, public_id: res.public_id };
};

export const uploadAttachmentsToCloudinary = async (
  base64: string,
  foldername: string = "course_attachments"
) => {
  const res = await cloudinary.uploader.upload(base64, {
    folder: foldername,
    resource_type: "auto",
  });
  return { url: res.secure_url, public_id: res.public_id };
};

export const deleteFromCloudinary = async (public_id: string) => {
  if (!public_id) return;
  await cloudinary.uploader.destroy(public_id);
};
