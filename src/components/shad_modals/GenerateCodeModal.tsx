import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useModal from "@/hooks/useModal.ts";
import ReactModal from "react-modal";

export default function GenerateCodeModal() {
  const { isOpen, setIsOpen } = useModal("generateCode");

  return (
    <ReactModal isOpen={isOpen} closeTimeoutMS={200} onRequestClose={() => setIsOpen(false)} className="flex justify-center flex-col outline-non" overlayClassName="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-30 flex justify-center items-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Generate code</CardTitle>
          <CardDescription>
            Generate a new code for accessing the online player.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Name of your project" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="framework">Framework</Label>
                <Select>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectItem value="sveltekit">SvelteKit</SelectItem>
                    <SelectItem value="astro">Astro</SelectItem>
                    <SelectItem value="nuxt">Nuxt.js</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter>
      </Card>
    </ReactModal>
  );
}
