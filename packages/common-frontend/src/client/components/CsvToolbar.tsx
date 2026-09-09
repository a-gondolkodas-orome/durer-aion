import { ExportCsv, Toolbar } from '@mui/x-data-grid';

// Only the export button: the columns/filter/density controls the stock
// GridToolbar also carries are not what the admin page's grids are for. A
// factory rather than a component taking props, because the grid's `slots`
// takes a component and `slotProps` would spread the name over every grid.
export function csvToolbar(fileName: string) {
  return function CsvToolbar() {
    return (
      <Toolbar>
        <ExportCsv
          // allColumns so a column hidden by default is still in the file; the
          // button columns opt out with disableExport.
          options={{ fileName, utf8WithBom: true, allColumns: true }}
        >
          Letöltés CSV-ként
        </ExportCsv>
      </Toolbar>
    );
  };
}
