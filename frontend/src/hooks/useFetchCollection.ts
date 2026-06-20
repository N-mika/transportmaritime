
import { useEffect } from "react";
import { useAppDispatch } from "../redux/hooks";
import { fetchCollection } from "../redux/thunk/featchData";

export const useFetchCollection = <T>(
  table: string,
  setter: (data: T[]) => any,
) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCollection<T>({ table, setter }));
  }, []); // deps = [] par défaut ou [activeTab] si nécessaire
};