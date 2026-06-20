import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Ship, Plus, MapPin, Calendar, User, Filter, Search } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { useSelector } from 'react-redux';
import { RootState } from '../redux';
import { formatHour, getDuration } from '../Tools/Tools';
import TripModal from "../components/TripModal"
import { statusTrip, TABLE_DATA_BASE, Trip } from '../data/type';
import { HeaderSection } from '../components/ui/HeaderSection';
import { tripVoid } from '../data/dataVoid';
import { useFetchCollection } from '../hooks/useFetchCollection';
import { setTripsInStore } from '../redux/feature/stJude';
import Loader from '../components/tools/Loader';
import useFinders from '../Tools/finders';
import PortModal from '../components/PortModal';

const Trips = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | statusTrip>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [boatFilter, setBoatFilter] = useState<string>('all');
  const [capitaineFilter, setCapitaineFilter] = useState<string>('all');
  const [currentTrip, setCurrentTrip] = useState<Trip>(tripVoid);
  const [typeModale, setTypeModale] = useState<"add" | "edit">('add')
  const [showAddNewPort, setShowAddNewPort] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const { findBoat } = useFinders()
  const { trip, boat: allBoat, loadingOne, goods } = useSelector((state: RootState) => state.stJude);
  const { allUser } = useSelector((state: RootState) => state.users);
  const allCapinaine = allUser.filter(u => u.role === 'Capitaine');

  useFetchCollection<Trip>(TABLE_DATA_BASE.TRIP, setTripsInStore);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTrip = trip
    .filter(trip => statusFilter === 'all' ? true : trip.status === statusFilter)
    .filter(trip => {
      if (timeFilter === 'all') return true;
      const departDate = new Date(trip.depart);
      const now = new Date();
      switch (timeFilter) {
        case 'day': return departDate.toDateString() === now.toDateString();
        case 'week': {
          const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
          const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
          return departDate >= startOfWeek && departDate <= endOfWeek;
        }
        case 'month': return departDate.getMonth() === now.getMonth() && departDate.getFullYear() === now.getFullYear();
      }
    })
    .filter(trip => {
      if (!specificDate) return true;
      const filterDate = new Date(specificDate);
      const departDate = new Date(trip.depart);
      return departDate.getFullYear() === filterDate.getFullYear() &&
        departDate.getMonth() === filterDate.getMonth() &&
        departDate.getDate() === filterDate.getDate();
    })

    .filter(trip => {
      if (!startDate && !endDate) return true;

      const departDate = new Date(trip.depart);

      const start = startDate
        ? new Date(startDate + 'T00:00:00')
        : null;

      const end = endDate
        ? new Date(endDate + 'T23:59:59')
        : null;

      if (start && end) {
        return departDate >= start && departDate <= end;
      }

      if (start) {
        return departDate >= start;
      }

      if (end) {
        return departDate <= end;
      }

      return true;
    })

    .filter(trip => boatFilter === 'all' ? true : trip.boatId === boatFilter)
    .filter(trip => {
      if (capitaineFilter === 'all') return true;
      const boat = findBoat(trip.boatId);
      return boat.crew.includes(capitaineFilter);
    })

    .filter(trip => {
      if (!normalizedSearch) return true;

      const boat = findBoat(trip.boatId);
      const capitaines = boat
        ? allUser
          .filter(u => boat.crew.includes(u.id))
          .map(u => `${u.name} ${u.lastName}`.toLowerCase())
        : [];

      return (
        trip.from.toLowerCase().includes(normalizedSearch) ||
        trip.to.toLowerCase().includes(normalizedSearch) ||
        trip.status.toLowerCase().includes(normalizedSearch) ||
        (boat?.name?.toLowerCase().includes(normalizedSearch) ?? false) ||
        capitaines.some(c => c.includes(normalizedSearch))
      );
    });
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (statut: statusTrip) => {
    switch (statut) {
      case 'Arriver': return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'Encours': return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'Prévu': return <Badge className="bg-orange-100 text-orange-800">Programmé</Badge>;
      default: return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  return (
    <div className="min-h-screen text-gray-900">
      <div className="max-w-full flex flex-col gap-4">
        {/* Header */}
        <HeaderSection
          title='Gestion des Trajets'
          subtitle='Planification et suivi des voyages'
          actions={
            <>
              <Button variant="default" onClick={() => setShowAddNewPort(true)}>
                <Plus className="h-4 w-4 mr-2" /> Gérer les ports
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => { setShowModal(true); setTypeModale('add'); setCurrentTrip(tripVoid) }}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter un trajet
              </Button>
            </>
          }
        />
        <Card className="flex">
          <CardContent className="pt-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par port, bateau, capitaine ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10" />
              </div>
            </div>
            <div className="grid md:grid-cols-5 gap-4 p-4 w-full">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Statut</label>
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Arriver">Terminé</SelectItem>
                    <SelectItem value="Encours">En cours</SelectItem>
                    <SelectItem value="Prévu">Programmé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Date début</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Date fin</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Période</label>
                <Select value={timeFilter} onValueChange={v => setTimeFilter(v as any)}>
                  <SelectTrigger className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="day">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Date spécifique</label>
                <Input
                  type="date"
                  value={specificDate}
                  onChange={e => setSpecificDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Bateau</label>
                <Select value={boatFilter} onValueChange={setBoatFilter}>
                  <SelectTrigger className="w-full">
                    <Ship className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les bateaux</SelectItem>
                    {allBoat.map((b, ke) => (
                      <SelectItem key={ke} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-600">Capitaine</label>
                <Select value={capitaineFilter} onValueChange={setCapitaineFilter}>
                  <SelectTrigger className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les capitaines</SelectItem>
                    {allCapinaine.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" /> Liste des Trajets ({filteredTrip.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Départ</TableHead>
                    <TableHead>Arrivée</TableHead>
                    <TableHead>Bateau</TableHead>
                    <TableHead>Poids marchandises</TableHead>
                    <TableHead className="text-center">Date Début Chargement</TableHead>
                    <TableHead>Date Départ</TableHead>
                    <TableHead>Date Arrivée</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                {!loadingOne && <TableBody>
                  {filteredTrip.map((trip, key) => {
                    const boat = findBoat(trip.boatId);
                    // Récupérer et calculer le poids des marchandises de ce trajet
                    const goodsForTrip = goods.filter(good => good.tripId === trip.id);
                    const totalWeightKg = goodsForTrip.reduce((sum, good) =>
                      sum + (Number(good.totalWeight) || 0), 0);

                    return (
                      <TableRow key={key} className="hover:bg-gray-50" onClick={() => { setShowModal(true); setTypeModale('edit'); setCurrentTrip(trip) }}>
                        <TableCell>{trip.from}</TableCell>
                        <TableCell>{trip.to}</TableCell>
                        <TableCell>{boat ? `${boat.name}` : '-'}</TableCell>
                        <TableCell className="text-center">
                          {goodsForTrip.length > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="font-semibold text-primary">
                                {(totalWeightKg / 1000).toFixed(2)} T
                              </span>
                              <span className="text-xs text-gray-500">
                                {totalWeightKg.toLocaleString('fr-FR')} kg
                              </span>
                              <span className="text-xs text-gray-400">
                                ({goodsForTrip.length} marchandise{goodsForTrip.length > 1 ? 's' : ''})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {trip.loadingStartDate ? (
                            <>
                              {formatDate(trip.loadingStartDate)}
                              <br />
                              {formatHour(trip.loadingStartDate)}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(trip.depart)}<br />{formatHour(trip.depart)}</TableCell>
                        <TableCell>{formatDate(trip.arrive)}<br />{formatHour(trip.arrive)}</TableCell>
                        <TableCell>{getDuration(trip.arrive, trip.depart)}</TableCell>
                        <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>}
              </Table>
            </div>
            {loadingOne ? <div className='flex items-center justify-center py-8'>
              <Loader />
            </div> : filteredTrip.length === 0 && (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aucun trajet trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {showAddNewPort && <PortModal onClose={() => setShowAddNewPort(false)} />}
      {showModal && <TripModal currentTrip={currentTrip} onClose={() => setShowModal(false)} type={typeModale} ></TripModal>}
    </div>
  );
}
export default Trips;