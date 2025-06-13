import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { ToolCheck } from 'src/main/types';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Save, Stethoscope } from 'lucide-react';
import { Table, TableBody, TableHeader } from './ui/table';
import { Button } from './ui/button';

export default function Doctor({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (prompt: boolean) => void;
}) {
    const [results, setResults] = useState<ToolCheck[] | null>(null);
    const [savedPath, setSavedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            setResults(null);
            window.api.runDoctorChecks().then((res: ToolCheck[]) => {
                setResults(res);
                setLoading(false);
            });
        }
    }, [open]);

    const saveReport = async () => {
        if (!results) return;
        const filePath = await window.api.saveDoctorReport(results);
        setSavedPath(filePath);
    };

    const allGood = results && results.every((tool) => tool.success);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex gap-2 items-center">
                        <Stethoscope />
                        <span>Stethoscope</span>
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                {loading ? (
                    <p className="text-gray-600 text-sm">🌀 Running system checks...</p>
                ) : (
                    <>
                        {allGood ? (
                            <p className="text-green-600 font-medium mb-4">
                                ✅ All systems are healthy!
                            </p>
                        ) : (
                            <p className="text-red-600 font-medium mb-4">
                                ⚠️ Some tools are missing or not working correctly.
                            </p>
                        )}

                        <Table className="w-full border border-gray-200 text-sm">
                            <TableHeader>
                                <tr className="bg-gray-100 text-left">
                                    <th className="p-2">Tool</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Version / Error</th>
                                    <th className="p-2">Action</th>
                                </tr>
                            </TableHeader>
                            <TableBody>
                                {results?.map((tool, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="p-2">{tool.name}</td>
                                        <td className="p-2">
                                            <span
                                                className={
                                                    tool.success
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }
                                            >
                                                {tool.success
                                                    ? '✅ OK'
                                                    : '❌ Missing'}
                                            </span>
                                        </td>
                                        <td className="p-2 text-xs">
                                            {tool.success ? (
                                                tool.version
                                            ) : (
                                                <span title={tool.error}>
                                                    {tool.error?.split('\n')[0]}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            {!tool.success && tool.link && (
                                                <a
                                                    href={tool.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-blue-600 underline"
                                                >
                                                    Download
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-6 flex items-center gap-4">
                            <Button
                                onClick={saveReport}
                                variant={'outline'}
                                size={'sm'}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                <span>Save Report</span>
                            </Button>
                            {savedPath && (
                                <span className="text-gray-600 text-sm">
                                    Saved at: {savedPath}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
