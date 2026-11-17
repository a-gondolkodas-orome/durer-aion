import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GameProvider, ClientRepoProvider, ErrorBoundary, Header, Layout, LoginLayout, Relay, SiteFooter, useTeamState, LoadTeamState } from 'common-frontend';
import { OfflineClientRepository } from './client-repository';
import { ThemeProvider } from '@mui/material/styles';
import { Container } from "@mui/material";
import { LoginToRelay } from './LoginToRelay';
import { isLanguage, localizeLabel } from 'schemas';
import { findPracticeSet } from './practice-sets';
import { rememberChosenLanguage } from './language';


// Branding, not configuration: every build of this app uses these, so they live
// in git rather than in a gitignored `.env` that goes stale when the sample
// changes (#443).
const ACCENT_COLOR = '#46871B';

const theme = {
  palette: {
    primary: {
      main: ACCENT_COLOR,
      contrastText: '#f5f5f5',
    },
  },
}

// Module scope, not component scope: App re-renders on every teamState change,
// and a lazy component or repository created in its body would get a new
// identity each time — remounting the whole game client after every answer.
const RelayClient = React.lazy(() => import('./ReactClient').then(module => ({ default: module.RelayClient })));
const clientRepository = new OfflineClientRepository();

function App() {
  // There is no real login here: the round selector stores the chosen test as
  // the "logged in team", which is what drives the header title below and the
  // switch between the selector and the game.
  const storedTeamState = useTeamState();
  const { t, i18n } = useTranslation();

  // The language dropdown is open to everyone here, so the tab title follows it.
  // `t` changes identity with the language.
  useEffect(() => {
    document.title = `${t('header.relayPractise')} – ${t('header.titlePlain')}`;
  }, [t]);

  // A stored test the site no longer lists, such as one saved under an
  // earlier version's codes, reads as none: the selector shows again.
  const practiceSet = storedTeamState ? findPracticeSet(storedTeamState.teamName) : undefined;
  // `undefined` while the stored test is still being read: neither the
  // selector nor a round shows yet.
  const teamState = storedTeamState === undefined ? undefined : practiceSet ? storedTeamState : null;

  // Shown in the header instead of the set's id.
  const setTitle = () => {
    if (!practiceSet) return undefined;
    const { metadata } = practiceSet;
    if (metadata.kind === 'other') {
      return localizeLabel(metadata.label, isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'hu');
    }
    // t('login.competitionType.local'), t('login.competitionType.final'), t('login.competitionType.online');
    return t(`login.competitionType.${metadata.round}`, { num: metadata.edition, category: metadata.category });
  };

  const heading = { title: t('header.titlePlain'), subtitle: t('header.relayPractise') };

  return (
    <GameProvider
      value={{
        RelayClient: RelayClient,
    }}>
      <ThemeProvider theme={theme}>
        <ClientRepoProvider
          value={clientRepository}>
          <Layout>
            <LoadTeamState />
            <Header
              teamName={teamState?.teamName ?? null}
              leaveLabel={t('relay.endTable.selectOtherRound')}
              languageSwitcher
              heading={heading}
              teamLabel={setTitle()}
              homeAddress='/..'
              onChooseLanguage={rememberChosenLanguage}
            />
            {/* `maxWidth={false}`: see the same Container in common-frontend's `Main` */}
            <Container
              maxWidth={false}
              sx={{
                paddingLeft: {
                  xs: "0px",
                  sm: "0px",
                  md: "0px",
                },
                paddingRight: {
                  xs: "0px",
                  sm: "0px",
                  md: "0px",
                },
                position: "relative",
                paddingBottom: "50px",
                maxWidth: "1200px",
              }}
              data-testid="mainRoot"
            >
              <ErrorBoundary>
                {teamState === null && <LoginLayout><LoginToRelay /></LoginLayout>}
                {teamState && <Relay state={teamState}/>}
              </ErrorBoundary>
            </Container>
            <SiteFooter gitCommitHash={import.meta.env.VITE_GIT_COMMIT_HASH} trackingNote/>
          </Layout>
        </ClientRepoProvider>
      </ThemeProvider>
    </GameProvider>
  )
}

export default App;
