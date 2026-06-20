import { useState, FC, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calculator, Search, TrendingUp, TrendingDown, Plus, Fuel, Trash, Edit, User, ArrowDownUp, CreditCard, Calendar } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux';
import { formatCurrency, formatDate } from '../Tools/Tools';
import { Button } from '../components/ui/button';
import CashFuelConsumption from '../components/FuelConsumptionForm';
import { HeaderSection } from '../components/ui/HeaderSection';
import { CashMovement, TABLE_DATA_BASE } from '../data/type';
import { cashMouvementVoid } from '../data/dataVoid';
import { useFetchCollection } from '../hooks/useFetchCollection';
import { setCashMovementsInStore } from '../redux/feature/stJude';
import Loader from '../components/tools/Loader';
import CashMovementForm from '../components/CashMovement';
import useFinders from '../Tools/finders';
import { onDeleteService } from '../data/service';
import { toast } from 'react-toastify';
import ModalDialog from '../components/tools/ModalDialog';

interface PropsGestionCaissePage {
  onSetTofeuldManage: (value: string) => void;
}
type CashMovementWithBalance = CashMovement & { 
  balance: number 
  trend: 'up' | 'down' | 'same';
};

const GestionCaissePage: FC<PropsGestionCaissePage> = ({ onSetTofeuldManage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCashForm, setShowCashModale] = useState<boolean>(false);
  const [showFuel, setShowFuel] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [typeModale, setTypeModale] = useState<"add" | "edit">('add');
  const [cashMouvementSelected, setCashMouvementSelected] = useState<CashMovement>(cashMouvementVoid);
  const [showModalDialog, setShowModalDialog] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const [specificDate, setSpecificDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [cashierFilter, setCashierFilter] = useState<string>("all");
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const dispatch = useDispatch();
  const { findUser } = useFinders()

  const { cashMouvement, loadingOne } = useSelector((state: RootState) => state.stJude);

  const now = new Date();
  // Pour le chargement des données
  useFetchCollection<CashMovement>(TABLE_DATA_BASE.CASHMOVEMENT, setCashMovementsInStore);

  const filteredTransactions = cashMouvement.filter((t) => {
    const transactionDate = new Date(t.date);

    // Filtre par période
    if (timeFilter === 'day') {
      if (
        transactionDate.getDate() !== now.getDate() ||
        transactionDate.getMonth() !== now.getMonth() ||
        transactionDate.getFullYear() !== now.getFullYear()
      ) return false;
    } else if (timeFilter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      if (transactionDate < startOfWeek || transactionDate > endOfWeek) return false;
    } else if (timeFilter === 'month') {
      if (
        transactionDate.getMonth() !== now.getMonth() ||
        transactionDate.getFullYear() !== now.getFullYear()
      ) return false;
    }

    // --- Filtre par intervalle de dates ---
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      if (start && transactionDate < start) return false;
      if (end && transactionDate > end) return false;
    }

    // --- Filtre par date spécifique ---
    if (specificDate) {
      const filterDate = new Date(specificDate);
      if (
        transactionDate.getDate() !== filterDate.getDate() ||
        transactionDate.getMonth() !== filterDate.getMonth() ||
        transactionDate.getFullYear() !== filterDate.getFullYear()
      ) return false;
    }

    // --- Filtre par type ---
    if (typeFilter !== 'all') {
      if (typeFilter === 'credit' && Number(t.credit) === 0) return false;
      if (typeFilter === 'debit' && Number(t.debit) === 0) return false;
    }

    // --- Filtre par cissier ---
    if (cashierFilter !== "all" && t.userId !== cashierFilter) return false;

    // --- Filtre par payeur ---
    if (payerFilter !== "all" && (t.payer ?? "-") !== payerFilter) return false;

    // --- Filtre par mode de paiement ---
    if (paymentModeFilter !== "all" && (t.paymentMode ?? "-") !== paymentModeFilter) return false;

    // Filtre par recherche
    const search = searchTerm.toLowerCase();
    if (
      !t.designation.toLowerCase().includes(search) &&
      !findUser(t.userId).name.toLowerCase().includes(search) &&
      !findUser(t.userId).lastName.toLowerCase().includes(search)
    ) return false;

    return true;
  });

  // AJOUT: Calcul du solde cumulatif - affichage du plus récent au plus ancien
const transactionsWithBalance = useMemo((): CashMovementWithBalance[] => {
  if (filteredTransactions.length === 0) return [];

  // 1. Tri chronologique (ancien → récent)
  const chronological = [...filteredTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let balance = 0;
  let previousBalance = 0;

  const map = new Map<string, { balance: number; trend: 'up' | 'down' | 'same' }>();

  chronological.forEach(t => {
    previousBalance = balance;
    balance += Number(t.credit) - Number(t.debit);

    let trend: 'up' | 'down' | 'same' = 'same';
    if (balance > previousBalance) trend = 'up';
    else if (balance < previousBalance) trend = 'down';

    map.set(t.id, { balance, trend });
  });

  // 2. Ordre d’affichage (récent → ancien)
  const displayOrder = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return displayOrder.map(t => ({
    ...t,
    balance: map.get(t.id)?.balance ?? 0,
    trend: map.get(t.id)?.trend ?? 'same'
  }));
}, [filteredTransactions]);


  // Totaux
  const totalDebit = filteredTransactions.reduce((sum, { debit }) => sum + Number(debit), 0);
  const totalCredit = filteredTransactions.reduce((sum, { credit }) => sum + Number(credit), 0);
  const solde = totalCredit - totalDebit;

  const handleDelete = async (id: string) => {
    const result = await onDeleteService(TABLE_DATA_BASE.CASHMOVEMENT, id);
    if (result === "success") {
      toast.success("Mouvement supprimé avec succès !");
      // met à jour le store localement sans recharger
      dispatch(setCashMovementsInStore(cashMouvement.filter((t) => t.id !== id)));
    } else {
      toast.error("Erreur lors de la suppression du mouvement !");
    }
    setShowModalDialog(false);
    setDeleteId('');
  };

  const onResponse = (id: string) => {
    handleDelete(id);
  }

  const currentUser = useSelector((state: RootState) => state.users.currentUser);
  const canEdit = currentUser?.role === "Propriétaire";

  return (
    <div className="min-h-screen">
      <div className="max-w-full text-primary">
        {/* Header */}
        <HeaderSection
          title="Gestion de Caisse"
          subtitle="Suivi des encaissements et décaissements"
          actions={
            <>
              <Button onClick={() => onSetTofeuldManage("fueldManage")}>
                <Fuel /> Voire la consommation du carburant
              </Button>
              <Button onClick={() => { setShowCashModale(true); setTypeModale("add"); setCashMouvementSelected(cashMouvementVoid) }}>
                <Plus /> Nouveau Mouvement
              </Button>
            </>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Crédit</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCredit)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Débit</CardTitle>
              <TrendingDown className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDebit)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde Net</CardTitle>
              <Calculator className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold`}>{formatCurrency(solde)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="pt-4 pb-4">
            {/* Recherche  */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 text-gray-600">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par désignation ou caissier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4 p-4 w-full">


              {/* Filtre par période */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Période</label>
                <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as 'all' | 'day' | 'week' | 'month')}>
                  <SelectTrigger className="w-full"><Calendar className="h-4 w-4 mr-2" /> <SelectValue placeholder="Période" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="day">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Date début</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Date fin</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
              </div>

              {/* Date spécifique */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Date spécifique</label>
                <Input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="w-full" />
              </div>

              {/* Type (Crédit / Débit) */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Type crédit/débit</label>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                  <SelectTrigger className="w-full">
                    <ArrowDownUp className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="credit">Crédit</SelectItem>
                    <SelectItem value="debit">Débit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Caissier */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Caissier</label>
                <Select value={cashierFilter} onValueChange={(v) => setCashierFilter(v)}>
                  <SelectTrigger className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Caissier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les caissiers</SelectItem>
                    {Array.from(new Set(cashMouvement.map(t => t.userId))).map(id => {
                      const u = findUser(id);
                      return <SelectItem key={id} value={id}>{u?.name} {u?.lastName}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Payeur */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Payeur</label>
                <Select value={payerFilter} onValueChange={(v) => setPayerFilter(v)}>
                  <SelectTrigger className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Payeur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les payeurs</SelectItem>
                    {Array.from(new Set(cashMouvement
                      .map(t => t.payer)
                      .filter((p): p is string => !!p)
                    )).map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode de paiement */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Mode de paiement</label>
                <Select value={paymentModeFilter} onValueChange={(v) => setPaymentModeFilter(v)}>
                  <SelectTrigger className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modes</SelectItem>
                    {Array.from(new Set(cashMouvement
                      .map(t => t.paymentMode)
                      .filter((m): m is string => !!m)
                    )).map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Calculator className="h-7 w-7" />
              Transactions ({transactionsWithBalance.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead className="text-center">Payeur</TableHead>
                    <TableHead className="text-center">Mode de paiement</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-center">Débit</TableHead>
                    <TableHead className="text-center">Crédit</TableHead>
                    <TableHead className="text-center">Solde</TableHead>
                    {canEdit && (
                      <TableHead className="text-center">Actions</TableHead>
                    )}
                    {/* <TableHead>Encaisseur</TableHead> */}
                  </TableRow>
                </TableHeader>
                {
                  !loadingOne && <TableBody>
                    {transactionsWithBalance.map((cashMouvent: CashMovementWithBalance) => (
                      <TableRow key={cashMouvent.id} className="hover:bg-gray-50"
                        onClick={() => {
                          // sil faut le decommenter si on veut que le flux de caisse soit modifiable
                          // setShowCashModale(true) ; 
                          // setTypeModale("edit") ;
                          // setCashMouvementSelected(cashMouvent)
                        }}>
                        <TableCell className="whitespace-normal max-w-[20%]">{formatDate(cashMouvent.date)}</TableCell>
                        <TableCell className="whitespace-normal max-w-[20%]">{`${findUser(cashMouvent.userId).name} ${findUser(cashMouvent.userId).lastName}`}</TableCell>
                        <TableCell className="text-center whitespace-normal max-w-[20%]">{cashMouvent.payer ?? "-"}</TableCell>
                        <TableCell className="text-center whitespace-normal max-w-[20%]">{cashMouvent.paymentMode ?? "-"}</TableCell>
                        <TableCell className="whitespace-normal max-w-[20%]">{cashMouvent.designation}</TableCell>
                        <TableCell className="text-center">{formatCurrency(cashMouvent.debit)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(cashMouvent.credit)}</TableCell>
                        <TableCell className="text-center font-medium">
                          <span className={`px-2 py-1 rounded 
                            ${cashMouvent.trend === 'down' && 'text-red-600'}
                            ${cashMouvent.trend === 'up' && 'text-green-600'}
                            ${cashMouvent.trend === 'same'}
                            `}>
                            {formatCurrency(cashMouvent.balance)}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="px-4 py-2 text-center flex justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setTypeModale("edit"); setCashMouvementSelected(cashMouvent); setShowCashModale(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setShowModalDialog(true); setDeleteId(cashMouvent.id); }}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                }

              </Table>
            </div>
            {
              loadingOne ? (
                <div className='flex flex-col items-center justify-center py-8'>
                  <Loader></Loader>
                </div>
              ) : transactionsWithBalance.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="">Aucune transaction trouvée</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
      {showCashForm && <CashMovementForm onClose={() => setShowCashModale(false)} cashMouvement={cashMouvementSelected} type={typeModale} ></CashMovementForm>}
      {showFuel && <CashFuelConsumption onClose={() => setShowFuel(false)} />}
      {showModalDialog && <ModalDialog action="delete" onClose={() => setShowModalDialog(false)} title="Suppression" type="CashMovement" id={deleteId} onResponse={onResponse}></ModalDialog>}
    </div>
  );
}
export default GestionCaissePage;