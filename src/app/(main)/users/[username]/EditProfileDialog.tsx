import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import CropImageDialog from "@/components/CropImageDialog";
import LoadingButton from "@/components/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserData } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Resizer from "react-image-file-resizer";
import { useUpdateProfileMutation } from "./mutations";
import makeAnimated from "react-select/animated";
import { Controller } from "react-hook-form";
import Select, { CSSObjectWithLabel } from "react-select";
import { useTheme } from "next-themes";
import skillsList from "../../../../data/skillsList.json";
import instrumentList from "../../../../data/instrumentList.json";
interface EditProfileDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const animatedComponents = makeAnimated();

const getCustomStyles = (theme: string | undefined) => ({
  control: (provided: CSSObjectWithLabel) => ({
    ...provided,
    fontSize: "16px",
    color: "hsl(var(--foreground))",
    backgroundColor: "hsl(var(--background))",
    borderColor: "hsl(var(--border))",
    "&:hover": {
      borderColor: "hsl(var(--ring))",
    },
  }),
  menu: (provided: CSSObjectWithLabel) => ({
    ...provided,
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
  }),
  option: (
    provided: CSSObjectWithLabel,
    state: { isSelected: boolean; isFocused: boolean },
  ) => ({
    ...provided,
    fontSize: "16px",
    color: state.isSelected
      ? "hsl(var(--primary-foreground))"
      : "hsl(var(--foreground))",
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
        ? "hsl(var(--muted))"
        : "hsl(var(--background))",
    "&:hover": {
      backgroundColor: "hsl(var(--muted))",
    },
  }),
  multiValue: (provided: CSSObjectWithLabel) => ({
    ...provided,
    backgroundColor: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
  }),
  multiValueLabel: (provided: CSSObjectWithLabel) => ({
    ...provided,
    color: "hsl(var(--primary-foreground))",
  }),
  multiValueRemove: (provided: CSSObjectWithLabel) => ({
    ...provided,
    color: "hsl(var(--primary-foreground))",
    "&:hover": {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
    },
  }),
});

const instruments = instrumentList.map((instrument: string) => ({
  value: instrument,
  label: instrument,
}));

const skills = skillsList.map((skill: string) => ({
  value: skill,
  label: skill,
}));

export default function EditProfileDialog({
  user,
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const form = useForm<UpdateUserProfileValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio || "",
      skills: user.userSkills.map((us) => us.skill.id) || [],
      instruments: user.userInstruments.map((ui) => ui.instrument.id) || [],
    },
  });

  const mutation = useUpdateProfileMutation();
  const { theme } = useTheme();

  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);

  function handleClose() {
    form.reset({
      displayName: user.displayName,
      bio: user.bio || "",
      skills: user.userSkills.map((us) => us.skill.id) || [],
      instruments: user.userInstruments.map((ui) => ui.instrument.id) || [],
    });
    onOpenChange(false);
  }

  async function onSubmit(values: UpdateUserProfileValues) {
    const newAvatarFile = croppedAvatar
      ? new File([croppedAvatar], `avatar_${user.id}.webp`)
      : undefined;

    mutation.mutate(
      {
        values,
        avatar: newAvatarFile,
      },
      {
        onSuccess: () => {
          setCroppedAvatar(null);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Avatar</Label>
          <AvatarInput
            src={
              croppedAvatar
                ? URL.createObjectURL(croppedAvatar)
                : user.avatarUrl || avatarPlaceholder
            }
            onImageCropped={setCroppedAvatar}
          />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instruments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instruments</FormLabel>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="instruments"
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={instruments}
                          components={animatedComponents}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          styles={getCustomStyles(theme)}
                          value={instruments.filter((instrument) =>
                            field.value.includes(instrument.value),
                          )}
                          onChange={(selectedOptions) => {
                            field.onChange(
                              selectedOptions.map((option) => option.value),
                            );
                          }}
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="skills"
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={skills}
                          components={animatedComponents}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          styles={getCustomStyles(theme)}
                          value={skills.filter((skill) =>
                            field.value.includes(skill.value),
                          )}
                          onChange={(selectedOptions) => {
                            field.onChange(
                              selectedOptions.map((option) => option.value),
                            );
                          }}
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <LoadingButton type="submit" loading={mutation.isPending}>
                Save
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface AvatarInputProps {
  src: string | StaticImageData;
  onImageCropped: (blob: Blob | null) => void;
}

function AvatarInput({ src, onImageCropped }: AvatarInputProps) {
  const [imageToCrop, setImageToCrop] = useState<File>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  function onImageSelected(image: File | undefined) {
    if (!image) return;

    Resizer.imageFileResizer(
      image,
      1024,
      1024,
      "WEBP",
      100,
      0,
      (uri) => setImageToCrop(uri as File),
      "file",
    );
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onImageSelected(e.target.files?.[0])}
        ref={fileInputRef}
        className="sr-only hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative block"
      >
        <Image
          src={src}
          alt="Avatar preview"
          width={150}
          height={150}
          className="size-32 flex-none rounded-full object-cover"
        />
        <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-black bg-opacity-30 text-white transition-colors duration-200 group-hover:bg-opacity-25">
          <Camera size={24} />
        </span>
      </button>
      {imageToCrop && (
        <CropImageDialog
          src={URL.createObjectURL(imageToCrop)}
          cropAspectRatio={1}
          onCropped={onImageCropped}
          onClose={() => {
            setImageToCrop(undefined);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />
      )}
    </>
  );
}
