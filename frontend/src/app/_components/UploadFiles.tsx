"use client";

import React from "react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import {
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircleIcon,
  CircleXIcon,
  CloudUploadIcon,
  FolderIcon,
  FolderInputIcon,
  PaperclipIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { HoverCardContent } from "@/components/ui/hover-card";

export function UploadFiles({ type }: { type: "button" | "icon" }) {
  const [files, setFiles] = React.useState<File[]>([]);

  function addFiles(filesFromInput: File[]) {
    setFiles((files) => {
      const newFiles = [...files];

      for (let file of filesFromInput) {
        // No duplicates
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

  function uploadFiles() {}

  return (
    <Dialog>
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

        <div className="grid rounded border divide-y overflow-none mt-4">
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
                        className="grid grid-cols-[auto,auto,1fr] gap-2"
                      >
                        <div className="font-bold">{e.label}</div>
                        <div className="font-bold">:</div>
                        <div>{e.value}</div>
                      </div>
                    ))}
                  </HoverCardContent>
                </HoverCard>

                <Button
                  type="button"
                  size={"icon"}
                  variant={"ghost"}
                  onClick={() => removeFile(f)}
                >
                  <CircleXIcon />
                </Button>
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
            className="hidden"
            onChange={(e) => {
              e.target.files && addFiles([...e.target.files]);
            }}
            multiple
          />

          <Button type="button">Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
