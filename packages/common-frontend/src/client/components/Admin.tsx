import { Stack } from '@mui/system';
import { useAddMinutes, useAll } from '../hooks/user-hooks';
import { Button, Dialog, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Fragment, useState } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { TeamModelDto } from '../dto/TeamStateDto';
import { TeamDetailDialog } from './TeamDetailDialog';
import { ImportTeams } from './ImportTeams';
import { csvToolbar } from './CsvToolbar';
import Form from './form';
import { ErrorMessage, Field } from 'formik';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { ConfirmDialogInterface, ConfirmDialog } from './ConfirmDialog';
import * as Yup from 'yup';
import { alpha } from '@mui/system'
import { FieldProps } from "formik"

const TeamsToolbar = csvToolbar('durer-csapatok');

/** The join codes of every import this page has made, one row per team.
 *
 * An import's answer carries the teams it wrote *and* the rows it accepted as
 * already there, wherever the file itself supplied their join codes — so
 * re-running a list that has grown by twenty teams hands back the whole list,
 * not the twenty. Appending that to what is already held would keep a team
 * once per import it appeared in, and the re-download would be a file that
 * cannot be imported again: `duplicate-teamname` refuses it.
 *
 * Keyed by team name, which the import treats as a team's identity. The later
 * row wins and keeps the earlier one's place, so the table stays in the order
 * the codes were first handed out.
 */
function mergeExported(held: string[][] | null, imported: string[][]): string[][] {
  const byTeamName = new Map<string, string[]>();
  for (const row of [...held ?? [], ...imported]) {
    byTeamName.set(row[0], row);
  }
  return [...byTeamName.values()];
}

// What the states mean is on MatchStatus in the `schemas` package.
const MATCH_STATE_DESCRIPTION = 'NOT STARTED: még nem kezdte el. IN PROGRESS: fut, időt lehet hozzáadni. FINISHED: nem indíthatja újra, de a pontszáma még nőhet.';

// The open tab is kept in `?tab=`, so a reload or a shared link opens the same
// one. Anything else in it is read as the default.
const TABS = ['csapatok', 'statisztika', 'importalas'] as const;
type AdminTab = typeof TABS[number];

function tabFromUrl(): AdminTab {
  const tab = new URLSearchParams(window.location.search).get('tab');
  return TABS.find(it => it === tab) ?? 'csapatok';
}

function tabToUrl(tab: AdminTab) {
  const url = new URL(window.location.href);
  if (tab === 'csapatok') {
    url.searchParams.delete('tab');
  } else {
    url.searchParams.set('tab', tab);
  }
  window.history.replaceState(window.history.state, '', url);
}

// Every panel stays mounted, so the grid keeps its filter, sort and page — and
// the import its pasted file — while another tab is open. Not `display: none`: the DataGrid measures its parent
// on every resize, and a zero width logs an error and lays it out for 0px.
const panelProps = (panel: AdminTab, open: AdminTab) => ({
  role: 'tabpanel',
  id: `admin-panel-${panel}`,
  'aria-labelledby': `admin-tab-${panel}`,
  sx: panel === open ? {} : { visibility: 'hidden', height: 0, overflow: 'hidden' },
});

export function Admin(props: { teamId?: string }) {
  const theme = useTheme();
  const getAll = useAll();
  const addMinutes = useAddMinutes();
  const { enqueueSnackbar } = useSnackbar();
  const { data, mutate } = useSWR("users/all", getAll)
  const [selectedRow, setSelectedRow] = useState<TeamModelDto | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogInterface | null>(null);
  const [tab, setTab] = useState<AdminTab>(tabFromUrl);
  // The join codes this page's imports generated: the import's own download is
  // the only file of them, and a team's dialog shows its code one team at a
  // time. Every import's rows, not the last one's, and held here rather than
  // in the tab's answer, which the next file replaces: a browser that blocked
  // the first download leaves the re-download button as the only way to those
  // codes, and importing the next batch before pressing it must not be what
  // loses them. Merged rather than appended, so a team an import saw twice is
  // held once: `mergeExported` above says why an import can hand back the same
  // team again.
  const [importedCodes, setImportedCodes] = useState<string[][] | null>(null);

  const teamFromPath = props.teamId ? data?.find(d => d.teamId === props.teamId) ?? null : null;
  // Until the list loads it is not known whether the path names a team, so
  // neither the team nor the tabs show; an unknown team falls back to the list.
  const teams = teamFromPath ? undefined : data;

  return (
    <Stack sx={{
      display: 'flex',
      height: '100%',
      paddingLeft: {
        xs: '10px',
        lg: 0
      },
      paddingRight: {
        xs: '10px',
        md: 0
      },
      backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
    }} data-testid="adminRoot">
      <Dialog
        maxWidth={false}
        slotProps={{ paper: {
          sx: {
            marginLeft: {
              xs: 0,
              md: '32px'
            },
            marginRight: {
              xs: 0,
              md: '32px'
            },
            maxWidth: {
              xs: '100%',
              md: 'calc(100% - 64px)'
            },
          }
        } }}
        open={
          selectedRow != null
        } onClose={() => {
            setSelectedRow(null);
           }}>
          {selectedRow && <TeamDetailDialog data={selectedRow} setConfirmDialog={setConfirmDialog}/>}
      </Dialog>
      <ConfirmDialog confirmDialog={confirmDialog}  setConfirmDialog={setConfirmDialog}/>
      <Stack sx={{ fontSize: "32px", textAlign: "center" }}>Admin felület</Stack>
      {teamFromPath && <TeamDetailDialog data={teamFromPath} setConfirmDialog={setConfirmDialog}/>}
      {teams && <>
      <Tabs
        value={tab}
        onChange={(_, value: AdminTab) => {
          setTab(value);
          tabToUrl(value);
        }}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Csapatok" value="csapatok" id="admin-tab-csapatok" aria-controls="admin-panel-csapatok"/>
        <Tab label="Statisztika" value="statisztika" id="admin-tab-statisztika" aria-controls="admin-panel-statisztika"/>
        <Tab label="Importálás" value="importalas" id="admin-tab-importalas" aria-controls="admin-panel-importalas"/>
      </Tabs>
      <Stack {...panelProps('csapatok', tab)}>
        <Stack sx={{ height: "635px" }}>
          <DataGrid columns={[
            {
              field: 'id',
              headerName: 'ID',
              width: 75,
              editable: false,
            },
            {
              field: 'teamName',
              headerName: 'Csapatnév',
              width: 200,
              editable: false,
            },
            {
              field: 'category',
              headerName: 'Kategória',
              width: 100,
              editable: false,
            },
            {
              field: 'pageState',
              headerName: 'Állapot',
              description: 'Melyik oldalt látja a csapat: DISCLAIMER, HOME, RELAY vagy STRATEGY. A játék oldalán a vége után is ott marad, amíg vissza nem lép.',
              width: 150,
              editable: false,
            },
            {
              field: 'other',
              headerName: 'Egyéb',
              width: 250,
              editable: false,
            },
            {
              field: 'relayMatchState',
              headerName: 'Relay',
              description: MATCH_STATE_DESCRIPTION,
              width: 120,
              editable: false,
            },
            {
              field: 'strategyMatchState',
              headerName: 'Strategy',
              description: MATCH_STATE_DESCRIPTION,
              width: 120,
              editable: false,
            },
            {
              field: 'view',
              width: 170,
              headerName: '',
              disableExport: true,
              renderCell: (renderData) => {
                return (
                  <Button
                    color='primary'
                    variant='contained'
                    onClick={() => {setSelectedRow(renderData.row)}}>
                      Szerkesztés
                  </Button>
                )
              }
            },
            {
              field: 'view_tab',
              width: 170,
              headerName: '',
              disableExport: true,
              renderCell: (renderData) => {
                return (
                  <Button
                    color='primary'
                    variant='contained'
                    onClick={() => {
                      window.open("/admin/" + renderData.row.teamId, '_blank', 'noopener,noreferrer')
                    }}>
                      + új tab
                  </Button>
                )
              }
            }
          ]}
          rows={teams.map((a) => {
            return {
              id: a.teamId,
              relayMatchState: a.relayMatch.state,
              strategyMatchState: a.strategyMatch.state,
              ...a,
            };
          })}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
            columns: {
              columnVisibilityModel: {
                other: false,
              },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          showToolbar
          slots={{ toolbar: TeamsToolbar }}
          sx={{
            height: "auto",
          }}
          />
        </Stack>
        <Stack sx={{ padding: "10px" }}>
          idő hozzáadása minden aktív játékosnak:
          <Form
          initialValues={{ time: '' }}
          validationSchema={Yup.object().shape({
            time: Yup.number()
              .integer('Egész számot kell írni')
              .typeError('Számot kell írni')
              .required('Nincs megadva érték')
            })}
          onSubmit={(values) => {
            setConfirmDialog({
              text: `Erősítsd meg, hogy minden aktuális csapatnak meg akarod növelni az idejét ${values.time} perccel`,
              confirm: async () => {
                try {
                  for (const a of teams) {
                    if (a.relayMatch.state === "IN PROGRESS") {
                      await addMinutes(a.relayMatch.matchID, values.time);
                    }
                    if (a.strategyMatch.state === "IN PROGRESS") {
                      await addMinutes(a.strategyMatch.matchID, values.time);
                    }
                  }
                  enqueueSnackbar("Sikeres művelet", { variant: 'success' });
                } catch (e) {
                  const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                  enqueueSnackbar(message, { variant: 'error' });
                }
              },
            })
          }}>
          <Stack sx={{ display: "flex", flexDirection: "row", margin: "15px" }}>
          <Field
            name="time"
          >
          {
            ({ field }: FieldProps<string | number>) => <input
              {...field}
              className="text-input"
              placeholder="perc"
              style={{
                width: '200px',
                borderWidth: '2px',
                borderColor: theme.palette.primary.main,
              }}
            />
          }</Field>
          <Button sx={{
            width: '150px',
            alignSelf: 'center',
            textTransform: 'none',
          }} variant='contained' color='primary' type="submit">
            hozzáadás
          </Button>
          </Stack>
          <ErrorMessage name="time"/><ErrorMessage name="time" render={msg => (
            <Stack sx={{ color: 'red', fontSize: '0.875rem' }}>
              {msg}
            </Stack>
          )}/>
        </Form>
        </Stack>
      </Stack>
      <Stack {...panelProps('statisztika', tab)}>
        <Stats data={teams}/>
      </Stack>
      <Stack {...panelProps('importalas', tab)}>
        <ImportTeams
          exported={importedCodes}
          onImported={(exportTable) => {
            setImportedCodes(held => mergeExported(held, exportTable));
            void mutate();
          }}/>
      </Stack>
      </>}
    </Stack>
  )
}

function Stats(props: { data: TeamModelDto[] }) {
  const categories = Array.from(new Set(props.data.map(it => it.category)));
  const stat = categories.sort().map(cat => {
    const current = props.data.filter(it => it.category === cat);
    const bothNotStarted = current.filter(it => it.strategyMatch.state === "NOT STARTED" && it.relayMatch.state === "NOT STARTED").length;
    const relayInProgress = current.filter(it => it.relayMatch.state === "IN PROGRESS").length;
    const strategyInProgress = current.filter(it => it.strategyMatch.state === "IN PROGRESS").length;
    const finishedRelayScores = current.flatMap(it => it.relayMatch.state === "FINISHED" ? [it.relayMatch.score] : []);
    const finishedStrategyScores = current.flatMap(it => it.strategyMatch.state === "FINISHED" ? [it.strategyMatch.score] : []);
    const strategyPoints = Array.from(new Set(finishedStrategyScores));
    const relayPoints = Array.from(new Set(finishedRelayScores));
    return {
      category: cat,
      all: current.length,
      notStarted: bothNotStarted,
      relayInProgress: relayInProgress,
      strategyInProgress: strategyInProgress,
      relay: finishedRelayScores.length,
      strategy: finishedStrategyScores.length,
      finished: current.filter(it => it.strategyMatch.state === "FINISHED" && it.relayMatch.state === "FINISHED").length,
      strategyPoints: strategyPoints.map(it => ({
        point: it,
        count: finishedStrategyScores.filter(s => s === it).length
      })),
      relayPoints: relayPoints.map(it => ({
        point: it,
        count: finishedRelayScores.filter(s => s === it).length
      })),
    }
  })
  return <Table>
    <TableHead>
      <TableRow>
        <TableCell>Kategória</TableCell>
        <TableCell>Összesen</TableCell>
        <TableCell>Váltó</TableCell>
        <TableCell>Stratégiás</TableCell>
        <TableCell>Teljes verseny</TableCell>
        <TableCell>Relay-Pontszámok</TableCell>
        <TableCell>Strategy-Pontszámok</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {stat.map(s => (
        <TableRow key={s.category}>
          <TableCell>{s.category}</TableCell>
          <TableCell>{s.all}</TableCell>
          <TableCell><Progress notStarted={s.all - s.relayInProgress - s.relay} inProgress={s.relayInProgress} finished={s.relay}/></TableCell>
          <TableCell><Progress notStarted={s.all - s.strategyInProgress - s.strategy} inProgress={s.strategyInProgress} finished={s.strategy}/></TableCell>
          <TableCell><Progress notStarted={s.notStarted} inProgress={s.all - s.notStarted - s.finished} finished={s.finished}/></TableCell>
          <TableCell>{s.relayPoints.sort((a, b) => a.point - b.point).map(it => <Fragment key={it.point}>{it.point}: {it.count} db <br/></Fragment>)}</TableCell>
          <TableCell>{s.strategyPoints.sort((a, b) => a.point - b.point).map(it => <Fragment key={it.point}>{it.point}: {it.count} db <br/></Fragment>)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
}

export function Progress(props: { notStarted: number, inProgress: number, finished: number }) {
  return (<>
    <i title='NOT STARTED' style={{ color: "red" }}>{props.notStarted}</i> / <i title='IN PROGRESS' style={{ color: "orange" }}>{props.inProgress}</i> / <i title='FINISHED' style={{ color: "green" }}>{[props.finished]}</i>
  </>);
}
