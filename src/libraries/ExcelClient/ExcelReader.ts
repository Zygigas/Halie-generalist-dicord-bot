import ExcelJS from 'exceljs';

export interface RawElement {
  name: string;
  value: string;
}

export async function exportXlsxToArrayOfElements(fileBuffer: ArrayBuffer): Promise<RawElement[][]> {

  let returnValue: RawElement[][] = [];

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  // for now, we assume all workbooks have only one sheet
  const worksheet = workbook.getWorksheet(1);
  
   if (!worksheet) {
    throw new Error("No worksheet found in the Excel file.");
  }

  // the format we will use is 1st row being used for headers, aka: data names. And each subsequent row only holds data.
  const headerRow = worksheet.getRow(1);
  // we make a headers list that will be used as reference later. we probably can just use it as is and not do too many validation checks.
  let headers: Array<string> = []; 
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    let value =  cell.value?.toString();
    headers.push(value!);
  });

  let PageCounter = 0;
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    if (row.number === 1) return; // skip the header row

    returnValue.push([]);

    let ElementCounter = 0;
    row.eachCell({ includeEmpty: true }, (cell) => {

      let value = cell.value?.toString();
      
      if (value !== undefined) {
        returnValue[PageCounter].push({ name: headers[ElementCounter], value: value });
      }

      ElementCounter++;
    });
    PageCounter++;

  });

  return returnValue;


}