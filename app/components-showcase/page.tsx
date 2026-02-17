"use client";

import React from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Icon,
  Input,
  Radio,
  Select,
  Spinner,
  Switch,
  Text,
} from "@/components/ui";
import { User, Mail, Search, Calendar } from "lucide-react";

export default function ComponentsShowcase() {
  const [checkboxValue, setCheckboxValue] = React.useState(false);
  const [radioValue, setRadioValue] = React.useState("option1");
  const [switchValue, setSwitchValue] = React.useState(false);

  return (
    <div className="min-h-screen bg-(--color-primary) p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Typography */}
        <section className="space-y-4">
          <Text variant="h2">Typography Components</Text>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <Text variant="h1">Heading 1</Text>
            <Text variant="h2">Heading 2</Text>
            <Text variant="h3">Heading 3</Text>
            <Text variant="h4">Heading 4</Text>
            <Text variant="h5">Heading 5</Text>
            <Text variant="h6">Heading 6</Text>
            <Text variant="p">
              This is a paragraph text. Lorem ipsum dolor sit amet, consectetur
              adipiscing elit.
            </Text>
            <Text variant="label">Label Text</Text>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <Text variant="h2">Buttons</Text>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="md">
                Medium
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button variant="primary" isLoading>
                Loading...
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" leftIcon={<User />}>
                With Icon
              </Button>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <Text variant="h2">Form Inputs</Text>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <Input type="text" placeholder="Enter your name" />
            <Input
              type="email"
              placeholder="Email"
              leftIcon={<Mail className="h-5 w-5" />}
            />
            <Input
              type="text"
              placeholder="Search..."
              rightIcon={<Search className="h-5 w-5" />}
            />
            <Input
              type="text"
              placeholder="With error"
              error="Invalid value"
              defaultValue="Invalid value"
            />
            <Input type="text" placeholder="Disabled" disabled />
          </div>
        </section>

        {/* Select */}
        <section className="space-y-4">
          <Text variant="h2">Select</Text>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <Select
              placeholder="Choose an option"
              options={[
                { value: "1", label: "Option 1" },
                { value: "2", label: "Option 2" },
                { value: "3", label: "Option 3" },
              ]}
            />
            <Select
              placeholder="With error"
              error="Please select an option"
              options={[
                { value: "1", label: "Option 1" },
                { value: "2", label: "Option 2" },
              ]}
            />
            <Select
              placeholder="Disabled"
              disabled
              options={[{ value: "1", label: "Option 1" }]}
            />
          </div>
        </section>

        {/* Form Controls */}
        <section className="space-y-4">
          <Text variant="h2">Form Controls</Text>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <Checkbox
              label="Accept terms and conditions"
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
            />
            <div className="space-y-2">
              <Radio
                label="Option 1"
                name="options"
                value="option1"
                checked={radioValue === "option1"}
                onChange={(e) => setRadioValue(e.target.value)}
              />
              <Radio
                label="Option 2"
                name="options"
                value="option2"
                checked={radioValue === "option2"}
                onChange={(e) => setRadioValue(e.target.value)}
              />
              <Radio
                label="Option 3"
                name="options"
                value="option3"
                checked={radioValue === "option3"}
                onChange={(e) => setRadioValue(e.target.value)}
              />
            </div>
            <Switch
              label="Enable notifications"
              checked={switchValue}
              onChange={(e) => setSwitchValue(e.target.checked)}
            />
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <Text variant="h2">Badges</Text>
          <div className="bg-white rounded-lg p-6">
            <div className="flex gap-4 flex-wrap">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>
        </section>

        {/* Avatars */}
        <section className="space-y-4">
          <Text variant="h2">Avatars</Text>
          <div className="bg-white rounded-lg p-6">
            <div className="flex gap-4 items-center flex-wrap">
              <Avatar name="John Doe" size="sm" />
              <Avatar name="Jane Smith" size="md" />
              <Avatar name="Bob Johnson" size="lg" />
              <Avatar size="md" />
            </div>
          </div>
        </section>

        {/* Spinner & Icons */}
        <section className="space-y-4">
          <Text variant="h2">Loading & Icons</Text>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex gap-4 items-center">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
            <div className="flex gap-4 items-center">
              <Icon icon={User} size="sm" />
              <Icon icon={Calendar} size="md" />
              <Icon icon={Mail} size="lg" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
