import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Filter, Package } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux';
import { formatCityName, formatCurrency, formatOnlyDate } from '../Tools/Tools';
import ReservationForm from '../components/GoodsForm';
import { v4 as uuid } from 'uuid';
import ModalUpdateGood from '../components/GoodsModalUpdate';
import { Badge } from '../components/ui/badge';
import { Goods, Reservation, TABLE_DATA_BASE } from '../data/type';
import { reservationVoid } from '../data/dataVoid';
import { HeaderSection } from '../components/ui/HeaderSection';
import { useFetchCollection } from '../hooks/useFetchCollection';
import { setGoodsInStore, setReservationsInStore } from '../redux/feature/stJude';
import Loader from '../components/tools/Loader';
import useFinders from '../Tools/finders';
import PaymentValidationButton from '../components/PaymentValidation';
import { onGetService } from '../data/service';
import { openReservationModal, closeReservationModal } from '../redux/feature/modalSlice';

const MarchandiseManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailGoodsModal, setShowDetailGoodsModal] = useState(false);
  const [currentGoods, setCurrentGoods] = useState<Goods[]>([]);
  const [currentReservation, setCurrentReservation] = useState<Reservation>(reservationVoid);
  const [specificDateTrip, setSpecificDateTrip] = useState<string>("");
  const [specificDateReservation, setSpecificDateReservation] = useState<string>("");
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tripFilter, setTripFilter] = useState<string>('all');
  const dispatch = useDispatch();
  const { findBoat, findTrip, findUser } = useFinders();
  const { currentUser } = useSelector((state: RootState) => state.users);
  const { loadingOne, reservation, goods } = useSelector((state: RootState) => state.stJude);
  const { isReservationModalOpen, reservationId } = useSelector((state: RootState) => state.modal);
  const [highlightedReservation, setHighlightedReservation] = useState<string | null>(null);
  const [focusPaymentButton, setFocusPaymentButton] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Ouvrir la modal de réservation
  const handleOpenReservationModal = () => {
    const newIdReservation = uuid();
    dispatch(openReservationModal(newIdReservation));
  };

  // Fermer la modal de réservation
  const handleCloseReservationModal = () => {
    dispatch(closeReservationModal());
  };

  // Sauvegarder l'état de la modal dans localStorage pour la persistance
  useEffect(() => {
    if (isReservationModalOpen && reservationId) {
      // Sauvegarder l'état d'ouverture
      localStorage.setItem('reservationModalState', JSON.stringify({
        isOpen: true,
        reservationId,
        timestamp: Date.now()
      }));
    } else {
      // Nettoyer si fermée
      localStorage.removeItem('reservationModalState');
    }
  }, [isReservationModalOpen, reservationId]);

  // Restaurer l'état de la modal au chargement de la page
  useEffect(() => {
    const savedModalState = localStorage.getItem('reservationModalState');
    if (savedModalState) {
      const parsedState = JSON.parse(savedModalState);

      // Vérifier si la modal a été fermée récemment (moins de 5 minutes)
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);

      if (parsedState.isOpen && parsedState.timestamp > fiveMinutesAgo) {
        dispatch(openReservationModal(parsedState.reservationId));
      } else {
        // Nettoyer si trop ancien
        localStorage.removeItem('reservationModalState');
      }
    }
  }, [dispatch]);

  // Récupérer la réservation à highlight depuis le localStorage
  useEffect(() => {
    const highlightReservation = localStorage.getItem('highlightReservation');
    const scrollToReservation = localStorage.getItem('scrollToReservation');
    const focusButton = localStorage.getItem('focusPaymentButton');

    if (highlightReservation && scrollToReservation === 'true') {
      setHighlightedReservation(highlightReservation);

      if (focusButton === 'true') {
        setFocusPaymentButton(highlightReservation);
      }

      localStorage.removeItem('highlightReservation');
      localStorage.removeItem('scrollToReservation');
      localStorage.removeItem('focusPaymentButton');


      setTimeout(() => {
        scrollToReservationRow(highlightReservation);
      }, 500);
    }
  }, [reservation]);

  // Fonction pour scroller vers une réservation spécifique
  const scrollToReservationRow = (reservationId: string) => {
    const rowElement = document.getElementById(`reservation-${reservationId}`);
    if (rowElement && tableRef.current) {
      rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Ajouter un highlight visuel
      rowElement.classList.add('bg-yellow-100', 'border-l-4', 'border-yellow-500');

      // Retirer le highlight après 5 secondes
      setTimeout(() => {
        rowElement.classList.remove('bg-yellow-100', 'border-l-4', 'border-yellow-500');
        setHighlightedReservation(null);
        setFocusPaymentButton(null);
      }, 5000);
    }
  };

  // Focus sur le bouton de paiement si nécessaire
  useEffect(() => {
    if (focusPaymentButton) {
      const buttonElement = document.getElementById(`payment-button-${focusPaymentButton}`);
      if (buttonElement) {
        // Ajouter une animation au bouton
        buttonElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50', 'animate-pulse');

        // focus automatique sur le bouton
        setTimeout(() => {
          buttonElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }, 1200);

        setTimeout(() => {
          buttonElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50', 'animate-pulse');
        }, 4000);
      }
    }
  }, [focusPaymentButton]);

  useFetchCollection<Goods>(TABLE_DATA_BASE.GOODS, setGoodsInStore);
  useFetchCollection<Reservation>(TABLE_DATA_BASE.RESERVATION, setReservationsInStore);

  const filteredReservations = reservation.filter((reservationItem) => {
    if (currentUser)
      if (currentUser.role === "Capitaine") {
        const currentTrip = findTrip(reservationItem.tripId);
        const currentboat = findBoat(currentTrip.boatId);

        if (!currentboat.crew.includes(currentUser.id)) return false;
      }

    if (statusFilter === "paid" && reservationItem.amountToPay !== 0) return false;
    if (statusFilter === "unpaid" && reservationItem.amountToPay === 0) return false;


    const search = searchTerm.toLowerCase();
    const user = findUser(reservationItem.userId);
    const trip = findTrip(reservationItem.tripId);

    // Filtre par date spécifique pour trajet
    const tripDepartDate = trip ? new Date(trip.depart) : null;
    if (specificDateTrip && tripDepartDate) {
      const filterDate = new Date(specificDateTrip);
      if (
        tripDepartDate.getDate() !== filterDate.getDate() ||
        tripDepartDate.getMonth() !== filterDate.getMonth() ||
        tripDepartDate.getFullYear() !== filterDate.getFullYear()
      ) return false;
    }

    // Filtre par date spécifique pour réservation
    if (specificDateReservation) {
      const reservationDate = new Date(reservationItem.date);
      const filterDate = new Date(specificDateReservation);

      if (
        reservationDate.getFullYear() !== filterDate.getFullYear() ||
        reservationDate.getMonth() !== filterDate.getMonth() ||
        reservationDate.getDate() !== filterDate.getDate()
      ) return false;
    }

    // Filtre par voyage
    if (tripFilter !== 'all') {
      const trip = findTrip(reservationItem.tripId);
      if (trip) {
        const tripLabel = `${formatCityName(trip.from)} → ${formatCityName(trip.to)}`;
        if (tripLabel !== tripFilter) return false;
      } else {
        return false; // Trip inconnu ne correspond pas
      }
    }

    // Filtre par période
    if (startDate || endDate) {
      const reservationDate = new Date(reservationItem.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && reservationDate < start) return false;
      if (end && reservationDate > end) return false;
    }

    return (
      reservationItem.clientName.toLowerCase().includes(search) ||
      reservationItem.destName.toLowerCase().includes(search) ||
      reservationItem.id.toLowerCase().includes(search) ||
      user.name.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      trip.from.toLowerCase().includes(search) ||
      trip.to.toLowerCase().includes(search)
    );
  });


  const onShowDetailGoodsModal = (reservationItem: Reservation) => {
    setCurrentReservation(reservationItem)
    setCurrentGoods(goods.filter(({ reservationId }) => reservationId === reservationItem.id));
    setShowDetailGoodsModal(true);
  }

  const goodsCountByReservation = goods.reduce<Record<string, number>>(
    (acc, good) => {
      acc[good.reservationId] = (acc[good.reservationId] || 0) + 1;
      return acc;
    },
    {}
  );


  return (
    <div className="min-h-screen relative text-gray-900">
      <div className="max-w-full ">
        {/* Header */}
        <HeaderSection
          title="Gestion des Marchandises"
          subtitle={
            highlightedReservation
              ? "Réservation en attente de validation mise en évidence"
              : "Suivi et gestion des marchandises transportées"
          }
          actions={
            <>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleOpenReservationModal}>
                <Plus className="h-4 w-4 mr-2" />Ajouter reservation
              </Button>
            </>
          }
        />

        {/* Filters */}
        <Card className="border-border hover:shadow-md transition-shadow mb-6">
          <CardContent className="pt-6">
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par client, port, caissier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Date début</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Date fin</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Date spécifique trajet</label>
                <Input
                  type="date"
                  value={specificDateTrip}
                  onChange={(e) => setSpecificDateTrip(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Date spécifique réservation</label>
                <Input
                  type="date"
                  value={specificDateReservation}
                  onChange={(e) => setSpecificDateReservation(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Voyage</label>
                <Select value={tripFilter} onValueChange={setTripFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les voyages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les voyages</SelectItem>
                    {Array.from(
                      new Set(
                        reservation
                          .map(r => {
                            const trip = findTrip(r.tripId);
                            if (!trip) return null;
                            return `${formatCityName(trip.from)} → ${formatCityName(trip.to)}`;
                          })
                          .filter(Boolean) // enlever les null
                      )
                    ).map((tripLabel, index) => (
                      <SelectItem key={index} value={tripLabel as string}>
                        {tripLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <label className="text-sm font-medium text-gray-600 mb-1 inline-block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Statut paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="unpaid">Non payé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Data Table */}
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-[#001F3F]">
              <Package className="h-5 w-5 mr-2" />
              Liste des Reservation ( {filteredReservations.length} )
              {highlightedReservation && (
                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                  Réservation à valider
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" ref={tableRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Voyage </TableHead>
                    <TableHead>Expediteur</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead className="text-centre">Nombre d'article</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Poids Total (kg)</TableHead>
                    <TableHead className="text-right">Prix Total</TableHead>
                    <TableHead className="text-right">Montant Payer</TableHead>
                    <TableHead className="text-right">Mode</TableHead>
                    <TableHead className="text-right">Validation</TableHead>
                    <TableHead className="text-right">Montant Restant</TableHead>
                    <TableHead className="text-center">Paiement</TableHead>
                  </TableRow>
                </TableHeader>
                {
                  !loadingOne && <TableBody>
                    {filteredReservations.map((reservationItem) => {
                      const trip = findTrip(reservationItem.tripId); // retrouver le trip lié
                      const isHighlighted = highlightedReservation === reservationItem.id;
                      return (
                        <TableRow
                          key={reservationItem.id}
                          id={`reservation-${reservationItem.id}`}
                          className={`hover:bg-gray-50 transition-all duration-300 ${isHighlighted ? 'bg-yellow-100 border-l-4 border-yellow-500 shadow-md' : ''
                            }`}
                          onClick={() => onShowDetailGoodsModal(reservationItem)}
                        >
                          <TableCell>{formatOnlyDate(reservationItem.date)}</TableCell>
                          <TableCell>
                            {trip
                              ? `${formatCityName(trip.from)} → ${formatCityName(trip.to)} (${new Date(trip.depart).toLocaleString('fr-FR', {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })})`
                              : "Voyage inconnu"}
                          </TableCell>
                          <TableCell>{reservationItem.clientName}</TableCell>
                          <TableCell>{reservationItem.destName}</TableCell>
                          <TableCell>
                            {`${findUser(reservationItem.userId).name} ${findUser(reservationItem.userId).lastName}`}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {goodsCountByReservation[reservationItem.id] ?? 0}
                          </TableCell>
                          <TableCell className="text-centre">{reservationItem.invoiceNumber}</TableCell>
                          <TableCell className="text-right">{Number(reservationItem.quantity)}</TableCell>
                          <TableCell className="text-right">{reservationItem.weight}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(reservationItem.totalPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(reservationItem.amountPaid)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span>{reservationItem.paymentMethod}</span>
                              {reservationItem.paymentRef && (
                                <span className="text-xs text-gray-500">Ref: {reservationItem.paymentRef}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-centre">
                            <PaymentValidationButton
                              reservation={reservationItem}
                              onValidationComplete={() => {
                                const loadData = async () => {
                                  const updatedReservations = await onGetService<any>(TABLE_DATA_BASE.RESERVATION);
                                  dispatch(setReservationsInStore(updatedReservations));
                                };
                                loadData();
                              }}
                              id={`payment-button-${reservationItem.id}`}
                            />
                            <Badge
                              variant={reservationItem.isConfirmed ? "default" : "secondary"}
                              className={reservationItem.isConfirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                            >
                              {reservationItem.isConfirmed ? `Validé par ${findUser(reservationItem.validatedBy || '').name}` : 'En attente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(reservationItem.amountToPay)}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={reservationItem.amountToPay === 0 ? "default" : "destructive"}
                              className={reservationItem.amountToPay === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {reservationItem.amountToPay === 0 ? 'Oui' : 'Non'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                }
              </Table>
            </div>
            {loadingOne ? (
              <div className='flex items-center justify-center py-8'>
                <Loader />
              </div>) : reservation.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune reservation trouvée</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
      {showDetailGoodsModal && (<ModalUpdateGood currentGoods={currentGoods} currentReservation={currentReservation} onClose={() => setShowDetailGoodsModal(false)} />)}
      {isReservationModalOpen && reservationId && (<ReservationForm onClose={handleCloseReservationModal} idReservation={reservationId} />)}
    </div>
  );
}

export default MarchandiseManagementPage;