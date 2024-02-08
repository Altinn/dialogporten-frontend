import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SealIcon, StarIcon } from "@navikt/aksel-icons";

import { InboxItems } from "../../../../frontend-design-poc/src/components/InboxItems";
import { InboxItem } from "../../../../frontend-design-poc/src/components/InboxItem";

const meta = {
  title: "Example/InboxItems",
  component: InboxItems,
  tags: ["autodocs"],
} satisfies Meta<typeof InboxItems>;

export default meta;
type Story = StoryObj<typeof meta>;

const SimpleExampleWithState = () => {
  const [isCheckedFirst, setIsCheckedFirst] = useState(false);
  const [isCheckedSecond, setIsCheckedSecond] = useState(false);
  const [isCheckedThird, setIsCheckedThird] = useState(false);

  return (
    <InboxItems>
      <InboxItem
        title="Har du glemt oss?"
        description="Beskrivelse"
        sender={{ label: "DigDir", icon: <StarIcon /> }}
        receiver={{ label: "Per Person" }}
        toLabel="til"
        tags={[
          { icon: <StarIcon />, label: "hello" },
          { icon: <StarIcon />, label: "hallaz" },
        ]}
        checkboxValue="value1"
        isChecked={isCheckedFirst}
        onCheckedChange={() => setIsCheckedFirst(!isCheckedFirst)}
      />
      <InboxItem
        title="Aksjeoppgaven for 2022"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sollicitudin, nisi vitae auctor accumsan, odio ipsum efficitur nulla, eu tempus sem leo et felis. Curabitur vel varius tortor. Proin semper in nisl eget venenatis. Vestibulum egestas urna id sapien iaculis, id consequat ante varius. Vestibulum vel facilisis nulla. Aenean vitae orci est. Nulla at sagittis mauris. Vestibulum nisl nibh, pulvinar non odio quis, fermentum aliquet tortor. Mauris imperdiet ante lacus. Sed pretium, lorem sed ornare vehicula, neque diam dictum massa, et aliquam lectus metus sit amet nunc. Aliquam erat volutpat. Aliquam ac massa mauris"
        sender={{ label: "DigDir" }}
        receiver={{ label: "Per Person" }}
        toLabel="til"
        tags={[
          { label: "hello", icon: <StarIcon /> },
          { label: "halla", icon: <SealIcon /> },
        ]}
        checkboxValue="value2"
        isChecked={isCheckedSecond}
        onCheckedChange={() => setIsCheckedSecond(!isCheckedSecond)}
      />
      <InboxItem
        title="Aksjeoppgaven for 2021"
        description="Integer lacinia ornare ex id consequat. Vivamus condimentum ex vitae elit dignissim convallis. Vivamus nec velit lacus. Vestibulum pharetra pharetra nibh vitae auctor."
        sender={{ label: "DigDir" }}
        receiver={{ label: "Per Person" }}
        toLabel="til"
        tags={[
          { label: "hello", icon: <StarIcon /> },
          { label: "hellu", icon: <SealIcon /> },
        ]}
        checkboxValue="value2"
        isChecked={isCheckedThird}
        onCheckedChange={() => setIsCheckedThird(!isCheckedThird)}
      />
    </InboxItems>
  );
};

export const simpleDesktopExample : Story = () => <SimpleExampleWithState />;
