import UploadImage from "@/assets/images/upload_file.png";
import { UploadFiles } from "@/components/upload-files";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grow py-4 px-2">
      <div className="w-full h-full flex justify-center items-center flex-col">
        <Image
          className="max-h-[400px] h-full w-auto"
          src={UploadImage}
          alt="Upload"
        />
        <UploadFiles type="button" />
      </div>
    </div>
  );
}
