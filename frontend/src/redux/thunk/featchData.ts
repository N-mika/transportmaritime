import { AppThunk } from "../index";
import {
  TABLE_DATA_BASE,
  Boat,
  CashMovement,
  FuelConsumption,
  Goods,
  Reservation,
  Trip,
  User,
} from "../../data/type";
import { onGetService } from "../../data/service";
import {
  setBoatsInStore,
  setCashMovementsInStore,
  setFuelConsumptionsInStore,
  setGoodsInStore,
  setReservationsInStore,
  setTripsInStore,
  setLoadingAll,
} from "../feature/stJude";
import { setLoadingOne } from "../feature/stJude";
import { setOldUsersAndAllUsers } from "../feature/users";

interface FetchCollectionProps<T> {
  table: string;
  setter: (data: T[]) => { type: string; payload: T[] };
}

export const fetchDatabase = (): AppThunk => async (dispatch) => {
  try {
    dispatch(setLoadingAll(true));
    const [goods, reservations, trips, boats, cashMovements, fuelConsumptions , oldUsers, users] =
      await Promise.all([
        onGetService<Goods>(TABLE_DATA_BASE.GOODS),
        onGetService<Reservation>(TABLE_DATA_BASE.RESERVATION),
        onGetService<Trip>(TABLE_DATA_BASE.TRIP),
        onGetService<Boat>(TABLE_DATA_BASE.BOAT),
        onGetService<CashMovement>(TABLE_DATA_BASE.CASHMOVEMENT),
        onGetService<FuelConsumption>(TABLE_DATA_BASE.FUELCONSUMPTION),
        onGetService<User>(TABLE_DATA_BASE.OLDEUSERS),
        onGetService<User>(TABLE_DATA_BASE.USER),
      ]);

    dispatch(setGoodsInStore(goods));
    dispatch(setReservationsInStore(reservations));
    dispatch(setTripsInStore(trips));
    dispatch(setBoatsInStore(boats));
    dispatch(setCashMovementsInStore(cashMovements));
    dispatch(setFuelConsumptionsInStore(fuelConsumptions));
    dispatch(setOldUsersAndAllUsers([...oldUsers, ...users]));
  } catch (error) {
    console.error("Erreur fetchDatabase:", error);
  } finally {
    dispatch(setLoadingAll(false));
  }
};

export const fetchCollection =
  <T>({ table, setter }: FetchCollectionProps<T>): AppThunk =>
  async (dispatch) => {
    try {
      dispatch(setLoadingOne(true));
      const data = await onGetService<T>(table);
      dispatch(setter(data));
    } catch (err) {
      console.error(err);
    } finally {
      dispatch(setLoadingOne(false));
    }
  };
