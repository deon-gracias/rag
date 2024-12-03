"use client";

import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CircleXIcon,
  CloudUploadIcon,
  FolderIcon,
  Loader2Icon,
  PaperclipIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { useSessionStore } from "@/store/session";
import { get_sessions, upload_files } from "@/lib/requests";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export function UploadFiles({ type }: { type: "button" | "icon" }) {
  const router = useRouter();

  const session = useSessionStore();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [quality, setQuality] = React.useState<string>("fast");

  function addFiles(filesFromInput: File[]) {
    setFiles((files) => {
      const newFiles = [...files];

      // No duplicates
      for (const file of filesFromInput) {
        if (!files.find((f) => file.name === f.name)) {
          newFiles.push(file);
        }
      }

      return newFiles;
    });
  }

  function removeFile(fileToRemove: File) {
    setFiles((files) => {
      const index = files.indexOf(fileToRemove); // Find file index
      return [...files.slice(0, index), ...files.slice(index + 1)];
    });
  }

  async function handleFilesUpload() {
    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.set("quality", quality);
      for (const file of files) form.append("files", file);

      const res = await upload_files(form);

      if (!res) {
        throw Error("Failed to upload data");
      }

      toast.success("File(s) Uploaded", {
        description: `Uploaded ${files.length} file(s)`,
      });

      const data = await get_sessions();
      session.set_sessions(data);

      router.push(`/chat/${res.name}`);
    } catch (e) {
      console.error(e);
      toast.error("failed to upload data");
    }

    setFiles([]);
    setOpen(false);
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {type === "button" && (
        <DialogTrigger asChild>
          <Button className="" size="lg">
            <CloudUploadIcon /> Upload Files
          </Button>
        </DialogTrigger>
      )}
      {type === "icon" && (
        <DialogTrigger asChild>
          <Button type="button" size="icon" variant="outline">
            <PaperclipIcon />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach Files</DialogTitle>
        </DialogHeader>

        <RadioGroup
          defaultValue="fast"
          disabled={isSubmitting}
          className="flex gap-4"
          value={quality}
          onValueChange={(value) => setQuality(value)}
        >
          <div className="flex items-center space-x-2 cursor-pointer">
            <RadioGroupItem value="fast" id="fast-radio-btn" />
            <Label htmlFor="fast-radio-btn">Fast</Label>
          </div>
          <div className="flex items-center space-x-2 cursor-pointer">
            <RadioGroupItem value="hi-res" id="hi-res-radio-btn" />
            <Label htmlFor="hi-res-radio-btn">Hi-Res</Label>
          </div>
        </RadioGroup>

        <div className="grid rounded border divide-y overflow-none">
          {files.length < 1 ? (
            <div className="bg-secondary flex items-center justify-center flex-col gap-2 py-10 rounded">
              <FolderIcon className="size-10 fill-foreground" />
              <h4 className="text-lg font-semibold">No File(s) Selected</h4>
            </div>
          ) : (
            files.map((f) => (
              <div
                key={f.name}
                className="font-mono px-2 py-2 grid grid-cols-[1fr,auto] justify-between items-center"
              >
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      className="w-full truncate justify-start"
                      variant={"ghost"}
                    >
                      {f.name}
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-fit">
                    {[
                      { label: "Name", value: f.name },
                      { label: "Type", value: f.type },
                      { label: "Size", value: f.size },
                    ].map((e) => (
                      <div
                        key={e.label}
                        className="grid grid-cols-[auto,auto,1fr] gap-2 text-xs"
                      >
                        <div className="font-bold">{e.label}</div>
                        <div className="font-bold">:</div>
                        <div>{e.value}</div>
                      </div>
                    ))}
                  </HoverCardContent>
                </HoverCard>

                {!isSubmitting && (
                  <Button
                    type="button"
                    size={"icon"}
                    variant={"ghost"}
                    onClick={() => removeFile(f)}
                  >
                    <CircleXIcon />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {files.length > 0 && (
          <div className="text-xs place-self-end text-foreground/50 mb-4">
            <span className="font-medium text-foreground/80">
              {files.length}
            </span>{" "}
            File(s) Selected
          </div>
        )}

        <div className="place-self-end flex gap-2">
          {!isSubmitting && (
            <>
              <Label
                htmlFor="file-upload"
                className={buttonVariants({ variant: "secondary" })}
              >
                <PaperclipIcon />
                Add Files
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) =>
                  e.target.files && addFiles([...e.target.files])
                }
                multiple
              />
            </>
          )}

          {isSubmitting && (
            <div className="flex items-center gap-2 px-4">
              <Loader2Icon className="size-4 animate-spin" />
              Indexing
            </div>
          )}

          <Button
            type="button"
            onClick={handleFilesUpload}
            disabled={isSubmitting}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
