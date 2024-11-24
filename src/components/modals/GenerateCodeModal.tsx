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
import useWebsocket from "@/hooks/useWebsocket.ts";
import { useQueryClient } from "@tanstack/react-query";
import { FormEventHandler, useState } from "react";
import ReactModal from "react-modal";
import { toast } from "sonner";

export default function GenerateCodeModal() {
  const { isOpen, setIsOpen, close } = useModal("generateCode");
  const { websocket: socket } = useWebsocket();
  const [label, setLabel] = useState("");
  const [expiresIn, setExpiresIn] = useState("");
  const queryClient = useQueryClient();
  const [shouldClear, setShouldClear] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    let expirationMethod = "";
    let expiresAt: number | undefined = undefined;

    if (expiresIn == "session") expirationMethod = "Session";
    else if (expiresIn == "never") expirationMethod = "Never";
    else {
      expiresAt = Date.now() + parseInt(expiresIn) * 1000 * 60;
      expirationMethod = "Timestamp";
    }

    socket
      .emitWithAck("generate_code", { expirationMethod, expiresAt })
      .then((code) => {
        toast.success("Code generated");

        const codes = queryClient.getQueryData(["dashboard-codes"]) as any[]

        queryClient.setQueryData(["dashboard-codes"], codes.concat(code));
      })
      .catch(() => {
        toast.error("Error");
      });

    close()
    setShouldClear(true);
  };

  return (
    <ReactModal
      isOpen={isOpen}
      closeTimeoutMS={200}
      onRequestClose={() => setIsOpen(false)}
      className="flex justify-center flex-col outline-non"
      overlayClassName="fixed inset-0 bg-black/50 dark:bg-black/30 flex justify-center items-center"
      onAfterClose={() => {
        if (shouldClear) {
          setLabel("");
          setExpiresIn("");
          setShouldClear(false);
        }
      }}
    > 
      <form onSubmit={handleSubmit}>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Generate code</CardTitle>
            <CardDescription>
              Generate a new code for accessing the online player.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="Label to distinguish code"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="expiration-method">Expires</Label>
                <Select onValueChange={(value) => setExpiresIn(value)}>
                  <SelectTrigger id="expiration-method">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="360">6 hours</SelectItem>
                    <SelectItem value="720">12 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                    <SelectItem value="10080">7 days</SelectItem>
                    <SelectItem value="session">Session end</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!expiresIn}>Generate</Button>
          </CardFooter>
        </Card>
      </form>
    </ReactModal>
  );
}
