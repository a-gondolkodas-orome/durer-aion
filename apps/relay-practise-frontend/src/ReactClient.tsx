import { GameRelay } from "game";
import { RelayStrategy } from "strategy";
import { InProgressRelay } from "common-frontend";
import { ClientFactoryRelay } from "./client_factory";

const description = <p className="text-justify"></p>
export const { ClientWithBot: RelayClientWithBotC } = ClientFactoryRelay({...GameRelay, name: "relay_c"}, InProgressRelay, RelayStrategy("C"), description);
export const { ClientWithBot: RelayClientWithBotD } = ClientFactoryRelay({...GameRelay, name: "relay_d"}, InProgressRelay, RelayStrategy("D"), description);
export const { ClientWithBot: RelayClientWithBotE } = ClientFactoryRelay({...GameRelay, name: "relay_e"}, InProgressRelay, RelayStrategy("E"), description);


export function RelayClient({ category }: {
  category?: undefined | 'A' | 'B' | 'C' | 'D' | 'E' | 'C+' | 'D+' | 'E+',
}) {
  return (
    <>
      {category === 'C' && (
        <RelayClientWithBotC />
      )}
      {category === 'D' && (
          <RelayClientWithBotD />
      )}
      {category === 'E' && (
          <RelayClientWithBotE />
      )}
    </>
  );
}