import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";

export function ExpenseTypeMapping() {
  return (
    <Card className="border-blue-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
        <CardTitle className="text-blue-800">
          BlackSmith Export Field Mapping
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-blue-50">
              <TableRow>
                <TableHead className="w-1/2">App Expense Type</TableHead>
                <TableHead className="w-1/2">Excel Column</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">fuel</TableCell>
                <TableCell>DIESEL</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">toll</TableCell>
                <TableCell>TOLL</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">loading</TableCell>
                <TableCell>LOAD</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">weighment</TableCell>
                <TableCell>WT.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">unloading</TableCell>
                <TableCell>UNLOAD</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">miscellaneous</TableCell>
                <TableCell>OTHER</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">topUp</TableCell>
                <TableCell>DRIVER</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">hydInward</TableCell>
                <TableCell>RENT CASH</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">rto</TableCell>
                <TableCell>RTO</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">rope</TableCell>
                <TableCell>ROPE</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">food</TableCell>
                <TableCell>DRIVER</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">electrical</TableCell>
                <TableCell>Home</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">mechanical</TableCell>
                <TableCell>Home</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">bodyWorks</TableCell>
                <TableCell>Home</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">tiresAir</TableCell>
                <TableCell>Home</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">tireGreasing</TableCell>
                <TableCell>Home</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">adblue</TableCell>
                <TableCell>Home</TableCell>
              </TableRow>
              <TableRow className="bg-blue-50">
                <TableCell className="font-medium">pouch + security</TableCell>
                <TableCell>LOADAMT</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}