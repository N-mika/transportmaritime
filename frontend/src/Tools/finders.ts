import { boatVoid, goodVoid, reservationVoid, tripVoid, userVoid } from "../data/dataVoid";
import { Goods } from "../data/type";
import { RootState } from "../redux";
import { useAppSelector } from "../redux/hooks";

const useFinders = () => {
  const allUser = useAppSelector((state: RootState) => state.users.oldUsersAndAllUsers);
  const allReservation = useAppSelector((state: RootState) => state.stJude.reservation);
  const allTripe = useAppSelector((state: RootState) => state.stJude.trip);
  const allBoat = useAppSelector((state: RootState) => state.stJude.boat);
  const allGoods = useAppSelector((state: RootState) => state.stJude.goods);

  const findUser = (idUser: string) => {
    const user = allUser.find((u) => u.id === idUser);
    return user ? user : userVoid;
  };

  const findReservation = (idReservation: string) => {
    const reservation = allReservation.find((r) => r.id === idReservation);
    return reservation ? reservation : reservationVoid;
  };

  const findTrip = (tripId: string) => {
    const trip = allTripe.find((trip) => trip.id === tripId);
    return trip ? trip : tripVoid;
  };
  const findBoat = (idBoat: string) => {
    const boat = allBoat.find(({ id }) => id === idBoat);
    return boat ? boat : boatVoid;
  };
  const findGoods = (idGoods: string , allGood : Goods[] = allGoods ) => {
    const good = allGood.find(({ id }) => id === idGoods);
    return good ? good : goodVoid;
  };
  return {
    findUser,
    findReservation,
    findTrip,
    findBoat,
    findGoods,
  };
};
export default useFinders;
