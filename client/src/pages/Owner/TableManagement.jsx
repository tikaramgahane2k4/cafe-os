import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Plus, Save, Trash2, Printer, RefreshCw, XCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const TableManagement = () => {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [tableCountInput, setTableCountInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Location Settings State
    const [locationSettings, setLocationSettings] = useState({ enabled: false, radius: 100, latitude: null, longitude: null });
    const [savingLocation, setSavingLocation] = useState(false);

    // Derive cafeId from user. In this system cafeId is typically user.tenantId or user.cafeId. 
    // Based on other owner contexts, let's assume it's user.cafeId or user.id. Wait, let's just use user.cafeId if available, else user.tenantId, else user.id.
    const cafeId = user?.tenantId || user?.cafeId || user?.id;

    const fetchTables = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/tables/${cafeId}`, {
                withCredentials: true
            });
            setTables(res.data);
            if (res.data.length > 0) {
                setTableCountInput(res.data.length.toString());
            }
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load tables.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocationSettings = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/auth/owner/${cafeId}/locationSettings`, { withCredentials: true });
            if (res.data) setLocationSettings(res.data);
        } catch (err) {
            console.error('Failed to load location settings', err);
        }
    };

    useEffect(() => {
        if (cafeId) {
            fetchTables();
            fetchLocationSettings();
        }
    }, [cafeId]);

    const handleSaveLocationSettings = async () => {
        try {
            setSavingLocation(true);
            await axios.put(`http://localhost:5000/api/auth/owner/${cafeId}/locationSettings`, locationSettings, { withCredentials: true });
            toast.success('Location settings saved successfully!');
        } catch (err) {
            console.error(err);
            setError('Failed to save location settings');
        } finally {
            setSavingLocation(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationSettings({
                    ...locationSettings,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            () => {
                setError('Unable to retrieve your location. Check browser permissions.');
            }
        );
    };

    const handleGenerateTables = async () => {
        if (!tableCountInput || isNaN(tableCountInput)) {
            setError('Please enter a valid number of tables');
            return;
        }

        try {
            setGenerating(true);
            const res = await axios.post('http://localhost:5000/api/tables/generate', {
                cafeId: cafeId,
                numberOfTables: parseInt(tableCountInput)
            }, {
                withCredentials: true
            });
            setTables(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to generate tables.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.setFontSize(22);
            pdf.setTextColor(75, 46, 30); // #4B2E1E
            pdf.text("Cafe QR Codes", pdfWidth / 2, 20, { align: "center" });

            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);

            const startY = 40;
            const marginX = 20;
            const qrSize = 40;
            const spacingX = 20;
            const spacingY = 30;

            const itemsPerRow = Math.floor((pdfWidth - 2 * marginX + spacingX) / (qrSize + spacingX));
            const actualMarginX = (pdfWidth - (itemsPerRow * qrSize + (itemsPerRow - 1) * spacingX)) / 2;

            let currentX = actualMarginX;
            let currentY = startY;

            tables.forEach((table, index) => {
                if (currentY + qrSize + 15 > pdfHeight - 20) {
                    pdf.addPage();
                    currentX = actualMarginX;
                    currentY = startY;
                }

                pdf.text(`Table ${table.tableNumber}`, currentX + qrSize / 2, currentY - 5, { align: "center" });

                const canvasEl = document.getElementById(`qr-canvas-${table.tableNumber}`);
                if (canvasEl) {
                    const imgData = canvasEl.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', currentX, currentY, qrSize, qrSize);
                }

                currentX += qrSize + spacingX;

                if ((index + 1) % itemsPerRow === 0) {
                    currentX = actualMarginX;
                    currentY += qrSize + spacingY;
                }
            });

            pdf.save('table-qrcodes.pdf');
        } catch (err) {
            console.error('Error generating PDF', err);
            setError(`Failed to generate PDF. Error: ${err.message || String(err)}`);
        }
    };

    const handleFreeTable = (tableNumber) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Mark Table Vacant',
            message: `Are you sure you want to mark Table ${tableNumber} as vacant?`,
            onConfirm: async () => {
                try {
                    await axios.post(`http://localhost:5000/api/tables/${cafeId}/${tableNumber}/free`, {}, {
                        withCredentials: true
                    });
                    setTables(tables.map(t => t.tableNumber === tableNumber ? { ...t, isOccupied: false, currentSession: null } : t));
                } catch (err) {
                    console.error(err);
                    setError('Failed to free table.');
                }
            }
        });
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in relative z-10 w-full">
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[#F5E6D3]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#4B2E1E] text-white rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                            <QrCode size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#4B2E1E]">Table & QR Code Management</h1>
                            <p className="text-gray-500 font-medium">Generate and print QR codes for your cafe tables.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-white border-2 border-[#C89B6D] text-[#C89B6D] hover:bg-[#C89B6D] hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-sm"
                    >
                        <Download size={20} />
                        <span className="hidden sm:inline">Download as PDF</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                {/* Geofencing Settings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5E6D3] mb-8 print:hidden">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold text-[#4B2E1E]">Location Validation (Geofencing)</h2>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">
                        Require customers to be physically present at your cafe to view the menu and occupy a table.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={locationSettings.enabled}
                                    onChange={(e) => setLocationSettings({ ...locationSettings, enabled: e.target.checked })}
                                    className="w-5 h-5 accent-[#C89B6D] cursor-pointer"
                                />
                                <span className="font-bold text-[#4B2E1E]">Enable Location Validation</span>
                            </label>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[#4B2E1E] mb-2">Allowed Radius (meters)</label>
                                <input
                                    type="number"
                                    min="10"
                                    value={locationSettings.radius}
                                    onChange={(e) => setLocationSettings({ ...locationSettings, radius: Number(e.target.value) })}
                                    className="w-full px-4 py-3 border-2 border-[#C89B6D] text-[#4B2E1E] bg-[#FFFBF7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C89B6D] focus:border-[#C89B6D] transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[#4B2E1E] mb-2">Cafe Coordinates</label>
                                <div className="flex gap-4 mb-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div><span className="font-semibold">Lat:</span> {locationSettings.latitude || 'Not set'}</div>
                                    <div><span className="font-semibold">Lng:</span> {locationSettings.longitude || 'Not set'}</div>
                                </div>
                                <button
                                    onClick={handleGetCurrentLocation}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors w-full"
                                >
                                    Use My Current Location
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleSaveLocationSettings}
                            disabled={savingLocation}
                            className="bg-[#053F2C] hover:bg-[#032e1f] text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-70"
                        >
                            {savingLocation ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>Save Settings</span>
                        </button>
                    </div>
                </div>

                {/* Generator Section */}
                <div className="bg-white p-6 justify-between rounded-2xl shadow-sm border border-[#F5E6D3] flex flex-wrap items-end gap-6 mb-8 print:hidden">
                    <div className="flex-1 w-full max-w-sm">
                        <label className="block text-sm font-bold text-[#4B2E1E] mb-2">Number of Tables in Your Cafe</label>
                        <input
                            type="number"
                            min="1"
                            value={tableCountInput}
                            onChange={(e) => setTableCountInput(e.target.value)}
                            className="w-full px-4 py-3 border border-[#F5E6D3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C89B6D]/50 focus:border-[#C89B6D] transition-colors"
                            placeholder="e.g. 15"
                        />
                    </div>
                    <div>
                        <button
                            onClick={handleGenerateTables}
                            disabled={generating}
                            className="bg-[#C89B6D] hover:bg-[#b08558] text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#C89B6D]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {generating ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>Generate QR Codes</span>
                        </button>
                    </div>
                </div>

                {/* QR Codes Grid */}
                {loading ? (
                    <div className="flex justify-center p-12">
                        <RefreshCw className="animate-spin text-[#C89B6D]" size={32} />
                    </div>
                ) : tables.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-[#C89B6D] text-center flex flex-col items-center">
                        <QrCode className="text-[#C89B6D]/50 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-[#4B2E1E] mb-2">No QR Codes Generated</h3>
                        <p className="text-gray-500 max-w-md">
                            Enter the number of tables in your cafe above to generate unique QR codes for each table. Customers will scan these to order.
                        </p>
                    </div>
                ) : (
                    <div id="qr-grid-container" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4 bg-white rounded-xl">
                        {tables.map((table) => {
                            // We can form the URL that the customer should visit when scanning
                            const scanUrl = `${window.location.origin}${table.qrCodeData}`;

                            return (
                                <div key={table._id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5E6D3] flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                    <h3 className="text-xl font-bold text-[#4B2E1E] mb-4">Table {table.tableNumber}</h3>
                                    <div className="bg-white p-2 border-2 border-gray-100 rounded-xl inline-block mb-4 shadow-sm">
                                        <QRCodeCanvas id={`qr-canvas-${table.tableNumber}`} value={scanUrl} size={128} level="H" />
                                    </div>
                                    <div className="mt-auto w-full">
                                        {table.isOccupied ? (
                                            <button
                                                onClick={() => handleFreeTable(table.tableNumber)}
                                                className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center justify-center gap-1 border border-red-200"
                                                title="Click to mark as vacant"
                                            >
                                                <XCircle size={14} />
                                                Mark Vacant
                                            </button>
                                        ) : (
                                            <div className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-green-100 text-green-700 text-center border border-green-200">
                                                Free
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-4 break-all truncate max-w-full print:hidden" title={scanUrl}>
                                        {table.qrCodeData}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <style dangerouslySetInnerHTML={{
                    __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .animate-fade-in, .animate-fade-in * {
            visibility: visible;
          }
          .animate-fade-in {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
            </div>
            {/* Confirm Dialog */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[#F5E6D3] print:hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-black text-[#4B2E1E] mb-2">{confirmDialog.title}</h3>
                            <p className="text-sm font-bold text-gray-500 mb-6">{confirmDialog.message}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors">Cancel</button>
                                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="flex-1 py-3 bg-[#4B2E1E] hover:bg-[#3D2B24] text-white rounded-xl font-bold transition-colors shadow-lg">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TableManagement;
