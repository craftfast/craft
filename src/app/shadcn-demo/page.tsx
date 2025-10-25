"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Upload,
  Settings,
  User,
  LogOut,
  Plus,
  Check,
} from "lucide-react";

export default function ShadcnDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">shadcn/ui Components Demo</h1>
          <p className="text-muted-foreground">
            A showcase of shadcn/ui components with neutral theme
          </p>
        </div>

        <Separator />

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>
              Different button styles and sizes for various use cases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>
              Inputs and labels for building forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Submit</Button>
          </CardFooter>
        </Card>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                This is the card content area. Add any content you need here.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Your current stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-semibold">567</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dialog Example */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog Component</CardTitle>
            <CardDescription>
              Modal dialogs for important actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Dropdown Menu Example */}
        <Card>
          <CardHeader>
            <CardTitle>Dropdown Menu</CardTitle>
            <CardDescription>
              Context menus and action dropdowns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Neutral Color Palette</CardTitle>
            <CardDescription>Theme colors using neutral shades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-background border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    background
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-foreground flex items-center justify-center">
                  <span className="text-xs text-background">foreground</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-xs text-primary-foreground">
                    primary
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-xs text-secondary-foreground">
                    secondary
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">muted</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-xs text-accent-foreground">accent</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-card border flex items-center justify-center">
                  <span className="text-xs text-card-foreground">card</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-destructive flex items-center justify-center">
                  <span className="text-xs text-destructive-foreground">
                    destructive
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Migration Guide</CardTitle>
            <CardDescription>
              How to migrate existing components to use shadcn/ui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Replace custom buttons
              </h3>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                {`// Before
<button className="px-4 py-2 bg-primary text-white rounded-lg">
  Click me
</button>

// After
<Button>Click me</Button>
<Button variant="outline">Click me</Button>`}
              </pre>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Replace custom inputs
              </h3>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                {`// Before
<input className="w-full px-3 py-2 border rounded-lg" />

// After
<Input placeholder="Enter text..." />
<Label htmlFor="input">Label</Label>
<Input id="input" />`}
              </pre>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Use Card components
              </h3>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                {`// Before
<div className="bg-surface border rounded-xl p-6">
  <h3>Title</h3>
  <p>Content</p>
</div>

// After
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
