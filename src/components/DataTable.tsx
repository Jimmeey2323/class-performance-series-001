
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: any[];
  columns: {
    header: string;
    accessorKey: string;
    className?: string;
  }[];
  location: string;
}

const DataTable = ({ data, columns, location }: DataTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, idx) => (
              <TableHead key={idx} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((column, colIdx) => (
                <TableCell 
                  key={`${idx}-${colIdx}`}
                  className={cn(
                    column.className,
                    "font-mono"
                  )}
                >
                  {row[column.accessorKey]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
