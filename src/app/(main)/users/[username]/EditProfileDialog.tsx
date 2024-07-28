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

const instruments = [
  "Accordion",
  "Alto Clarinet",
  "Alto Flute",
  "Alto Horn",
  "Alto Saxophone",
  "Bagpipes",
  "Balalaika",
  "Bandoneon",
  "Banjo",
  "Baritone Horn",
  "Baritone Saxophone",
  "Baroque Guitar",
  "Bass Clarinet",
  "Bass Flute",
  "Bass Guitar",
  "Bass Recorder",
  "Bass Saxophone",
  "Bass Trombone",
  "Bass Trumpet",
  "Bassoon",
  "Bawu",
  "Berimbau",
  "Bodhrán",
  "Bongo Drums",
  "Bouzouki",
  "Bugle",
  "Cajón",
  "Calliope",
  "Cello",
  "Celtic Harp",
  "Chapman Stick",
  "Charango",
  "Chimes",
  "Cimbalom",
  "Clarinet",
  "Clavichord",
  "Clavinet",
  "Concertina",
  "Conga Drums",
  "Contrabass Clarinet",
  "Contrabass Saxophone",
  "Cor Anglais",
  "Cornet",
  "Cowbell",
  "Crwth",
  "Cuatro",
  "Cymbals",
  "Darbuka",
  "Dhol",
  "Didgeridoo",
  "Djembe",
  "Dobro",
  "Dombra",
  "Double Bass",
  "Dulcimer",
  "Ektara",
  "English Horn",
  "Euphonium",
  "Fiddle",
  "Flugelhorn",
  "Flute",
  "French Horn",
  "Gamelan",
  "Glockenspiel",
  "Gong",
  "Gottuvadhyam",
  "Guitar",
  "Guqin",
  "Guzheng",
  "Harmonica",
  "Harmonium",
  "Harp",
  "Harpsichord",
  "Horn",
  "Hurdy-Gurdy",
  "Kalimba",
  "Kamancheh",
  "Kantele",
  "Kazoo",
  "Kemenche",
  "Kenny G's Saxophone",
  "Kithara",
  "Klarino",
  "Kora",
  "Koto",
  "Kundu",
  "Lagerphone",
  "Laúd",
  "Lute",
  "Lyre",
  "Mandocello",
  "Mandolin",
  "Maracas",
  "Marimba",
  "Mellophone",
  "Melodica",
  "Moog Synthesizer",
  "Musical Saw",
  "Ney",
  "Oboe",
  "Ocarina",
  "Octobass",
  "Ophicleide",
  "Organ",
  "Pan Flute",
  "Pennywhistle",
  "Piano",
  "Piccolo",
  "Pipa",
  "Psaltery",
  "Quena",
  "Rackett",
  "Recorder",
  "Reed Organ",
  "Riq",
  "Sarangi",
  "Sarod",
  "Sarrusophone",
  "Saxophone",
  "Shamisen",
  "Shawm",
  "Shehnai",
  "Sitar",
  "Snare Drum",
  "Sopranino Saxophone",
  "Soprano Saxophone",
  "Sousaphone",
  "Spinet",
  "Steel Drums",
  "Surbahar",
  "Susap",
  "Synthesizer",
  "Tabla",
  "Tambura",
  "Tambourine",
  "Tenor Horn",
  "Tenor Saxophone",
  "Theremin",
  "Timpani",
  "Tiple",
  "Tom-Tom Drums",
  "Triangle",
  "Trombone",
  "Trumpet",
  "Tuba",
  "Ukulele",
  "Veena",
  "Vibraphone",
  "Viola",
  "Violin",
  "Virginal",
  "Washtub Bass",
  "Whamola",
  "Wobble Board",
  "Xylophone",
  "Yangqin",
  "Yaylı Tambur",
  "Zampoña",
  "Zither",
  "Zurna",
].map((instrument: string) => ({ value: instrument, label: instrument }));

const skills = [
  "A&R Representative",
  "Accountant",
  "Artist Manager",
  "Assistant Tour Manager",
  "Audio Engineer",
  "Backup Dancer",
  "Booking Agent",
  "Business Manager",
  "Catering Manager",
  "Concert Organizer",
  "Concert Promoter",
  "Content Creator",
  "Costume Designer",
  "Creative Director",
  "Dance Choreographer",
  "Dancer",
  "Digital Marketing Specialist",
  "Event Coordinator",
  "Event Planner",
  "Festival Organizer",
  "Film Composer",
  "Graphic Designer",
  "Guitar Technician",
  "Lighting Designer",
  "Lighting Technician",
  "Live Sound Engineer",
  "Logistics Coordinator",
  "Lyricist",
  "Marketing Director",
  "Marketing Manager",
  "Media Buyer",
  "Media Director",
  "Merchandise Designer",
  "Merchandise Manager",
  "Merchandise Seller",
  "Music Agent",
  "Music Arranger",
  "Music Critic",
  "Music Director",
  "Music Journalist",
  "Music Lawyer",
  "Music Librarian",
  "Music Manager",
  "Music Marketing Consultant",
  "Music Producer",
  "Music Promoter",
  "Music Publisher",
  "Music Publicist",
  "Music Teacher",
  "Music Therapist",
  "Music Video Director",
  "Music Video Editor",
  "Music Video Producer",
  "Orchestra Manager",
  "Podcast Host",
  "Podcast Producer",
  "Poster Designer",
  "Production Assistant",
  "Production Manager",
  "Production Runner",
  "Public Relations Specialist",
  "Publicist",
  "Radio DJ",
  "Radio Host",
  "Recording Engineer",
  "Recording Studio Manager",
  "Recording Technician",
  "Record Producer",
  "Rehearsal Director",
  "Remixer",
  "Road Manager",
  "Roadie",
  "Scriptwriter",
  "Security Guard",
  "Set Designer",
  "Social Media Manager",
  "Sound Designer",
  "Sound Engineer",
  "Sound Mixer",
  "Sound Technician",
  "Stagehand",
  "Stage Manager",
  "Streaming Specialist",
  "Studio Manager",
  "Talent Agent",
  "Talent Buyer",
  "Talent Manager",
  "Technical Director",
  "Tour Bus Driver",
  "Tour Manager",
  "Tour Planner",
  "Tour Publicist",
  "Touring Crew",
  "Video Director",
  "Video Editor",
  "Video Producer",
  "Voice Over Artist",
  "Wardrobe Manager",
  "Web Designer",
  "Web Developer",
  "YouTube Content Creator",
  "Advertising Specialist",
  "Audio-Visual Technician",
  "Brand Manager",
  "CD/DVD Manufacturer",
  "Communications Director",
  "Crowd Management Specialist",
  "Data Analyst",
  "Distribution Manager",
  "Event Security",
  "Fan Engagement Specialist",
  "Grant Writer",
  "Hospitality Coordinator",
  "Insurance Broker",
  "Investor Relations Specialist",
  "Legal Advisor",
  "Lighting Director",
  "Logistics Manager",
  "Media Planner",
  "Multimedia Specialist",
  "Operations Manager",
  "Payroll Specialist",
  "Performance Coach",
  "Personal Assistant",
  "Photographer",
  "Printer",
  "Public Affairs Specialist",
  "Public Speaking Coach",
  "Record Store Owner",
  "Rehearsal Space Owner",
  "Researcher",
  "Retail Manager",
  "Road Crew",
  "Sales Manager",
  "SEO Specialist",
  "Set Builder",
  "Social Media Influencer",
  "Soundproofing Specialist",
  "Sponsorship Coordinator",
  "Stage Designer",
  "Streaming Platform Representative",
  "Studio Owner",
  "Talent Scout",
  "Ticket Sales Manager",
  "Ticket Taker",
  "Tour Accountant",
  "Tour Coordinator",
  "Tour Guide",
  "Tour Public Relations",
  "Translator",
  "Travel Agent",
  "Video Content Creator",
  "Visual Effects Artist",
  "Voice Coach",
  "Volunteer Coordinator",
  "Wardrobe Assistant",
  "Website Administrator",
  "Writer",
  "3D Animator",
  "Album Cover Designer",
  "Art Director",
  "Audio Archivist",
  "Band Photographer",
  "Blog Writer",
  "Camera Operator",
  "Catering Staff",
  "CD Pressing Plant Operator",
  "Charity Coordinator",
  "Digital Content Manager",
  "Digital Strategist",
  "Distribution Specialist",
  "E-commerce Manager",
  "Entertainment Lawyer",
  "Event Designer",
  "Event Ticketing Manager",
  "Fan Club Manager",
  "Festival Director",
  "Graphic Artist",
  "Interactive Media Designer",
  "Journalist",
  "Label Executive",
  "Lighting Operator",
  "Lyric Video Creator",
  "Marketing Analyst",
  "Market Researcher",
  "Media Relations Specialist",
  "Merchandise Distributor",
  "Music Blogger",
  "Music Historian",
  "Music Licensing Specialist",
  "Music Public Relations",
  "Nonprofit Manager",
  "Online Community Manager",
  "Podcast Editor",
  "Print Shop Operator",
  "Production Coordinator",
  "Props Manager",
  "Public Relations Manager",
  "Record Label Owner",
  "Recording Studio Owner",
  "Retail Sales Associate",
  "Sales Representative",
  "Show Host",
  "Social Media Coordinator",
  "Sound Editor",
  "Sponsorship Manager",
  "Stage Lighting Technician",
  "Talent Booker",
  "Tour Merchandiser",
  "Tour Photographer",
  "Tour Videographer",
  "Videographer",
  "Voice Artist",
  "Web Content Manager",
].map((skill: string) => ({ value: skill, label: skill }));

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
      instruments: user.instruments || [],
      skills: user.skills || [],
    },
  });

  const mutation = useUpdateProfileMutation();
  const { theme } = useTheme();

  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
