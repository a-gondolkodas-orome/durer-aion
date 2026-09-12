import { Stack } from '@mui/system';
import { useAddMinutes, useAll, useRemoveAllTeams } from '../hooks/user-hooks';
import { Button, Dialog, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tab, Tabs } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Fragment, useState } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { TeamModelDto } from '../dto/TeamStateDto';
import { TeamDetailDialog } from './TeamDetailDialog';
import { DeletedTeams } from './DeletedTeams';
import { ImportTeams } from './ImportTeams';
import { csvToolbar } from './CsvToolbar';
import Form from './form';
import { ErrorMessage, Field } from 'formik';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { FinishedMatchStatus } from 'schemas';
import { ConfirmDialogInterface, ConfirmDialog } from './ConfirmDialog';
import * as Yup from 'yup';
import { alpha } from '@mui/system'
import { FieldProps } from "formik"

const TeamsToolbar = csvToolbar('durer-csapatok');

// The page's tabs. Component state rather than a path: `Main.tsx` reads
// `/admin/<teamId>` off the URL, so a path for the archive would be taken for
// a team id. Issue #135 is the rest of the page's layout.
type AdminTab = 'teams' | 'deleted' | 'import';

export function Admin(props: { teamId?: string }) {
  const theme = useTheme();
  const getAll = useAll();
  const addMinutes = useAddMinutes();
  const removeAllTeams = useRemoveAllTeams();
  const { enqueueSnackbar } = useSnackbar();
  const { data, mutate } = useSWR("users/all", getAll)
  const [selectedRow, setSelectedRow] = useState<TeamModelDto | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogInterface | null>(null);
  const [adminPageOpen, setAdminPageOpen] = useState<boolean>(true);
  const [tab, setTab] = useState<AdminTab>('teams');

  // Read off the list rather than kept as state, so a team deleted from the
  // `/admin/<teamId>` page drops out with the list's next load and the page
  // falls back to the grid instead of showing the team it no longer has.
  const teamFromPath = props.teamId ? data?.find(d => d.teamId === props.teamId) ?? null : null;
  const showTeams = !teamFromPath && tab === 'teams';

  // The server has dropped the team: the dialog closes, and the grid reloads so
  // it no longer offers a team that is gone.
  const onRemoved = () => {
    setSelectedRow(null);
    void mutate();
  };

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
          {selectedRow && <TeamDetailDialog data={selectedRow} setConfirmDialog={setConfirmDialog} onRemoved={onRemoved}/>}
      </Dialog>
      <ConfirmDialog confirmDialog={confirmDialog}  setConfirmDialog={setConfirmDialog}/>
      <Stack sx={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <IconButton
          onClick={() => setAdminPageOpen(!adminPageOpen)}
          size="large"
          sx={{ marginRight: "8px" }}
        >
          {adminPageOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
        <Stack sx={{ fontSize: "32px", textAlign: "center" }}>Admin felület </Stack>
      </Stack>
      {adminPageOpen && <>
        {teamFromPath && <TeamDetailDialog data={teamFromPath} setConfirmDialog={setConfirmDialog} onRemoved={onRemoved}/>}
        {!teamFromPath && <Tabs value={tab} onChange={(_, value: AdminTab) => setTab(value)} sx={{ marginBottom: '8px' }}>
          <Tab value="teams" label="Csapatok"/>
          <Tab value="deleted" label="Törölt csapatok"/>
          <Tab value="import" label="Importálás"/>
        </Tabs>}
        {!teamFromPath && tab === 'deleted' &&
          <DeletedTeams setConfirmDialog={setConfirmDialog} onRestored={() => { void mutate(); }}/>}
        {!teamFromPath && tab === 'import' && <ImportTeams onImported={() => { void mutate(); }}/>}
        {showTeams && <Stack sx={{
          height: "635px",
        }}>
          {data && <DataGrid columns={[
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
              width: 120,
              editable: false,
            },
            {
              field: 'strategyMatchState',
              headerName: 'Strategy',
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
          rows={data.map((a) => {
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
          />}
        </Stack>}
        {showTeams && data && <Stack sx={{ padding: "10px" }}>
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
                  for (const a of data ?? []) {
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
        </Stack>}
        {showTeams && data &&
          <Button
            color="error"
            variant="contained"
            sx={{ margin: '10px 0', maxWidth: 300 }}
            onClick={() => {
              setConfirmDialog({
                text: 'Biztosan törlöd az összes csapatot? A Törölt csapatok fülön állíthatók vissza.',
                confirm: async () => {
                  try {
                    // One request, one transaction: all of them go, or none,
                    // and they land in the archive as one batch.
                    const { deleted } = await removeAllTeams();
                    enqueueSnackbar(`${deleted} csapat törölve`, { variant: 'success' });
                  } catch (e) {
                    const message = e instanceof Error ? e.message : "Váratlan hiba történt";
                    enqueueSnackbar(message, { variant: 'error' });
                  } finally {
                    await mutate();
                  }
                }
              });
            }}
          >
            Összes csapat törlése
          </Button>}
      {showTeams && data && <Stats data={data}/>}
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
    const finishedRelayScores = current.filter(it => it.relayMatch.state === "FINISHED").map(it => (it.relayMatch as FinishedMatchStatus).score);
    const finishedStrategyScores = current.filter(it => it.strategyMatch.state === "FINISHED").map(it => (it.strategyMatch as FinishedMatchStatus).score);
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
