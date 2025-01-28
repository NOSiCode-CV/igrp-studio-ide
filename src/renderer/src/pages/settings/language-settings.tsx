import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select"
import { Label } from "@renderer/components/ui/label"

export function LanguageSettings() {
  return (
    <div>
      <div className="pb-4">
        <h2 className="text-lg font-semibold">Language & Region</h2>
        <p className="text-sm text-muted-foreground">Manage your language and region preferences</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">Display Language</Label>
          <Select defaultValue="en">
            <SelectTrigger id="language">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

