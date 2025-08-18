import { Stack } from '@mui/system';
import { useAddMinutes, useAll } from '../hooks/user-hooks';
import { Button, Dialog, Table, TableCell, TableRow } from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { DataGrid } from '@mui/x-data-grid';
import { TeamModelDto } from '../dto/TeamStateDto';
import { TeamDetailDialog } from './TeamDetailDialog';
import Form from './form';
import { ErrorMessage, Field } from 'formik';
import theme from './theme';
import { useSnackbar } from 'notistack';
import { FinishedMatchStatus } from 'schemas';
import { ConfirmDialogInterface, ConfirmDialog } from './ConfirmDialog';
import * as Yup from 'yup';

export function Admin(props: {teamId?: String}) {
  const getAll = useAll();
  const addMinutes = useAddMinutes();
  const { enqueueSnackbar } = useSnackbar();
  const { data } = useSWR("users/all", getAll)
  const [selectedRow, setSelectedRow] = useState<TeamModelDto | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogInterface | null>(null);
  const [teamFromPath, setTeamFromPath] = useState<TeamModelDto | null>(null);
  const [refreshProblems, setRefreshProblems] = useState(0);

  useEffect(()=>{
    if (props.teamId) {
      const current = data?.find(d=>d.teamId === props.teamId)
      if (current) {
        setTeamFromPath(current);
      }
    } else if (teamFromPath) {
      setTeamFromPath(null);
    }
  }, [data, props.teamId, teamFromPath]);

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
      backgroundColor: "#fff",
    }} data-testid="adminRoot">
      <Dialog 
        maxWidth={false} 
        PaperProps={{
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
        }}
        open={
          selectedRow != null
        } onClose={async () => {
            setSelectedRow(null); 
           }}>
          {selectedRow && <TeamDetailDialog data={selectedRow!!} setConfirmDialog={setConfirmDialog}/>}
      </Dialog>
      <ConfirmDialog confirmDialog={confirmDialog}  setConfirmDialog={setConfirmDialog}/>
      <Stack sx={{width: "100%", display:"flex", flexDirection: "row"}}>
        <Stack sx={{fontSize:"32px", width: "100%", textAlign: "center"}}>Admin felület </Stack>
      </Stack>
      {teamFromPath && <TeamDetailDialog data={teamFromPath!!} setConfirmDialog={setConfirmDialog}/>}
      {!teamFromPath && <Stack sx={{
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
            renderCell: (renderData) => {
              return (
                <Button
                  color='primary'
                  variant='contained'
                  onClick={() => {setSelectedRow(renderData.row as TeamModelDto)}}>
                    Szerkesztés
                </Button>
              )
            }
          },
          {
            field: 'view_tab',
            width: 170,
            headerName: '',
            renderCell: (renderData) => {
              return (
                <Button
                  color='primary'
                  variant='contained'
                  onClick={()=>{
                    window.open("/admin/"+renderData.row.teamId, '_blank', 'noopener,noreferrer')
                  }}>
                    + új tab
                </Button>
              )
            }
          }
        ]}
        rows={data.map((a)=>{
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
        sx={{
          height: "auto",
        }}
        />}
      </Stack>}
      {!teamFromPath && data && <Stack sx={{padding: "10px"}}>
        idő hozzáadása minden aktív játékosnak:
        <Form
        initialValues={{ time: '' }}
        validationSchema={Yup.object().shape({
          time: Yup.number()
            .integer('Egész számot kell írni')
            .typeError('Számot kell írni')
            .required('Nincs megadva érték')
          })}
        onSubmit={async (values) => { 
          setConfirmDialog({
            text: `Erősítsd meg, hogy minden aktuális csapatnak meg akarod növelni az idejét ${values.time} perccel`,
            confirm: () => {
              try {
                data?.forEach(async a=>{
                  if(a.relayMatch.state === "IN PROGRESS") {
                    await addMinutes(a.relayMatch.matchID, values.time);
                  }
                  if(a.strategyMatch.state === "IN PROGRESS") {
                    await addMinutes(a.strategyMatch.matchID, values.time);
                  }
                })
                enqueueSnackbar("Sikeres művelet", { variant: 'success' });
              } catch (e: any) {
                enqueueSnackbar(e?.message || "Hiba történt", { variant: 'error' });
              }
            },
          })
        }}>
        <Stack sx={{display: "flex", flexDirection: "row", margin: "15px"}}>
        <Field
          name="time"
        >
        {
          ({
            field, 
            form: { handleChange },
          }: any) => <input
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
        <ErrorMessage name="time" render={msg => (
          <Stack sx={{ color: 'red', fontSize: '0.875rem' }}>
            {msg}
          </Stack>
        )}/>
      </ Form>
      </Stack>}
      
      {/* Problems Upload Section */}
      {!teamFromPath && <ProblemsUpload onUploadSuccess={() => setRefreshProblems(prev => prev + 1)} />}
      
      {/* Problems Viewer Section */}
      {!teamFromPath && <ProblemsViewer refreshTrigger={refreshProblems} />}
      
     {!teamFromPath && data && <Stats data={data}/>}
    </Stack>
  )
}

function ProblemsUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      enqueueSnackbar("Válassz ki fájlokat a feltöltéshez", { variant: 'warning' });
      return;
    }

    // Validate files: one TOML and multiple image files
    const tomlFiles = Array.from(selectedFiles).filter(file => 
      file.name.toLowerCase().endsWith('.toml')
    );
    const imageFiles = Array.from(selectedFiles).filter(file => 
      /\.(png|jpg|jpeg|gif)$/i.test(file.name)
    );

    if (tomlFiles.length !== 1) {
      enqueueSnackbar("Pontosan egy TOML fájlt kell kiválasztani", { variant: 'error' });
      return;
    }

    if (imageFiles.length === 0) {
      enqueueSnackbar("Legalább egy képfájlt (.png, .jpg, .jpeg, .gif) ki kell választani", { variant: 'warning' });
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      // Add all files to FormData
      Array.from(selectedFiles).forEach(file => {
        formData.append('file', file);
      });

      const response = await fetch('/game/admin/problems/upload', {
        method: 'PUT',
        body: formData,
        credentials: 'include', // Include authentication credentials
      });

      const result = await response.json();

      if (response.ok && result.success) {
        enqueueSnackbar(
          `Sikeres feltöltés! ${result.problemsAdded} feladat hozzáadva.`, 
          { variant: 'success' }
        );
        // Clear selection
        setSelectedFiles(null);
        const fileInput = document.getElementById('problems-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Trigger refresh of problems viewer
        onUploadSuccess();
      } else {
        enqueueSnackbar(
          result.error || 'Hiba történt a feltöltés során', 
          // style: { whiteSpace: 'pre-line' } so that the 
          // toml errors are properly formatted in multiple lines
          { variant: 'error', style: { whiteSpace: 'pre-line' } }
        );
      }
    } catch (error: any) {
      enqueueSnackbar(
        error?.message || 'Hálózati hiba történt', 
        { variant: 'error' }
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack sx={{ padding: "10px", borderTop: "1px solid #ccc", marginTop: "20px" }}>
      <h3>Feladatok feltöltése</h3>
      <p>Válassz ki egy TOML fájlt a feladatokkal és a hozzájuk tartozó képfájlokat:</p>
      
      <Stack sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", margin: "15px 0" }}>
        <input
          id="problems-file-input"
          type="file"
          multiple
          accept=".toml,.png,.jpg,.jpeg,.gif"
          onChange={handleFileChange}
          style={{
            padding: "8px",
            borderWidth: "2px",
            borderColor: theme.palette.primary.main,
            borderStyle: "solid",
            borderRadius: "4px",
            minWidth: "300px"
          }}
        />
        
        <Button
          sx={{
            width: '150px',
            textTransform: 'none',
          }}
          variant='contained'
          color='primary'
          onClick={handleUpload}
          disabled={uploading || !selectedFiles}
        >
          {uploading ? 'Feltöltés...' : 'Feltöltés'}
        </Button>
      </Stack>

      {selectedFiles && selectedFiles.length > 0 && (
        <Stack sx={{ marginTop: "10px" }}>
          <strong>Kiválasztott fájlok:</strong>
          <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
            {Array.from(selectedFiles).map((file, index) => (
              <li key={index} style={{ 
                color: file.name.toLowerCase().endsWith('.toml') ? 'blue' : 
                       /\.(png|jpg|jpeg|gif)$/i.test(file.name) ? 'green' : 'red'
              }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </Stack>
      )}
      
      <Stack sx={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
        <strong>Útmutató:</strong>
        <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
          <li>Válassz ki pontosan <strong>egy TOML fájlt</strong> a feladatokkal</li>
          <li>Válaszd ki az összes <strong>képfájlt</strong> (.png, .jpg, .jpeg, .gif), amelyekre a TOML fájl hivatkozik</li>
          <li>A TOML fájlban az attachment mezőkben csak a fájlneveket add meg (útvonal nélkül)</li>
        </ul>
      </Stack>
    </Stack>
  );
}

function ProblemsViewer({ refreshTrigger }: { refreshTrigger: number }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('C');
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const categories = ['C', 'D', 'E'];

  const fetchProblems = useCallback(async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/game/admin/problems/get/${category}`, {
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setProblems(result.problems || []);
      } else {
        enqueueSnackbar(
          result.error || 'Hiba történt a feladatok betöltése során',
          { variant: 'error' }
        );
        setProblems([]);
      }
    } catch (error: any) {
      enqueueSnackbar(
        error?.message || 'Hálózati hiba történt',
        { variant: 'error' }
      );
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchProblems(selectedCategory);
  }, [selectedCategory, fetchProblems]);

  // Refresh when refreshTrigger changes (after upload)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchProblems(selectedCategory);
    }
  }, [refreshTrigger, selectedCategory, fetchProblems]);

  return (
    <Stack sx={{ padding: "10px", borderTop: "1px solid #ccc", marginTop: "20px" }}>
      <h3>Feladatok megtekintése</h3>
      
      <Stack sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", margin: "15px 0" }}>
        <strong>Kategória:</strong>
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'contained' : 'outlined'}
            color='primary'
            onClick={() => setSelectedCategory(category)}
            sx={{ textTransform: 'none' }}
          >
            {category}
          </Button>
        ))}
        <Button
          variant='outlined'
          color='secondary'
          onClick={() => fetchProblems(selectedCategory)}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Frissítés
        </Button>
      </Stack>

      {loading && <p>Betöltés...</p>}
      
      {!loading && problems.length === 0 && (
        <p style={{ color: '#666' }}>Nincsenek feladatok ebben a kategóriában.</p>
      )}
      
      {!loading && problems.length > 0 && (
        <Stack sx={{ marginTop: "10px" }}>
          <strong>{selectedCategory} kategória - {problems.length} feladat:</strong>
          
          <Table sx={{ marginTop: "10px", border: "1px solid #ccc" }}>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><strong>Index</strong></TableCell>
              <TableCell><strong>Feladat szövege</strong></TableCell>
              <TableCell><strong>Válasz</strong></TableCell>
              <TableCell><strong>Pontszám</strong></TableCell>
              <TableCell><strong>Melléklet</strong></TableCell>
            </TableRow>
            {problems
              .sort((a, b) => a.index - b.index)
              .map((problem, idx) => (
                <TableRow key={idx} sx={{ borderBottom: "1px solid #ddd" }}>
                  <TableCell>{problem.index}</TableCell>
                  <TableCell sx={{ maxWidth: "300px", wordWrap: "break-word" }}>
                    {problem.problemText}
                  </TableCell>
                  <TableCell>{problem.answer}</TableCell>
                  <TableCell>{problem.points}</TableCell>
                  <TableCell>
                    {problem.attachmentUrl ? (
                      <a 
                        href={problem.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: theme.palette.primary.main }}
                      >
                        {problem.attachmentFileName}
                      </a>
                    ) : (
                      <span style={{ color: '#666' }}>Nincs</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </Table>
        </Stack>
      )}
    </Stack>
  );
}

function Stats(props: {data: TeamModelDto[]}) {
  const categories = Array.from(new Set(props.data.map(it=>it.category)));
  const stat = categories.sort().map(cat=>{
    const current = props.data.filter(it=>it.category===cat);
    const bothNotStarted = current.filter(it=>it.strategyMatch.state === "NOT STARTED" && it.relayMatch.state === "NOT STARTED").length;
    const relayInProgress = current.filter(it=>it.relayMatch.state === "IN PROGRESS").length;
    const strategyInProgress = current.filter(it=>it.strategyMatch.state === "IN PROGRESS").length;
    const finishedRelayScores = current.filter(it=>it.relayMatch.state === "FINISHED").map(it=>(it.relayMatch as FinishedMatchStatus).score);
    const finishedStrategyScores = current.filter(it=>it.strategyMatch.state === "FINISHED").map(it=>(it.strategyMatch as FinishedMatchStatus).score);
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
      finished: current.filter(it=>it.strategyMatch.state === "FINISHED" && it.relayMatch.state === "FINISHED").length,
      strategyPoints: strategyPoints.map(it=> ({
        point: it,
        count: finishedStrategyScores.filter(s=>s === it).length
      })),
      relayPoints: relayPoints.map(it=> ({
        point: it,
        count: finishedRelayScores.filter(s=>s === it).length
      })),
    }
  })
  return <Table>
    <TableRow>
      <TableCell>Kategória</TableCell>
      <TableCell>Összesen</TableCell>
      <TableCell>Váltó</TableCell>
      <TableCell>Stratégiás</TableCell>
      <TableCell>Teljes verseny</TableCell>
      <TableCell>Relay-Pontszámok</TableCell>
      <TableCell>Strategy-Pontszámok</TableCell>
    </TableRow>
    {stat.map(s=> (
      <TableRow>
        <TableCell>{s.category}</TableCell>
        <TableCell>{s.all}</TableCell>
        <TableCell><Progress notStarted={s.all - s.relayInProgress - s.relay} inProgress={s.relayInProgress} finished={s.relay}/></TableCell>
        <TableCell><Progress notStarted={s.all - s.strategyInProgress - s.strategy} inProgress={s.strategyInProgress} finished={s.strategy}/></TableCell>
        <TableCell><Progress notStarted={s.notStarted} inProgress={s.all - s.notStarted - s.finished} finished={s.finished}/></TableCell>
        <TableCell>{s.relayPoints.sort((a, b)=>a.point-b.point).map(it=><>{it.point}: {it.count} db <br/></>)}</TableCell>
        <TableCell>{s.strategyPoints.sort((a, b)=>a.point-b.point).map(it=><>{it.point}: {it.count} db <br/></>)}</TableCell>
      </TableRow>
    ))}
  </Table>
}

export function Progress(props: { notStarted: number, inProgress: number, finished: number}) {
  return ( <>
    <i title='NOT STARTED' style={{color: "red"}}>{props.notStarted}</i> / <i title='IN PROGRESS' style={{color: "orange"}}>{props.inProgress}</i> / <i title='FINISHED' style={{color: "green"}}>{[props.finished]}</i>
  </>);
}
