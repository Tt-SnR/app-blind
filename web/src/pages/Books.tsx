// src/pages/Books.tsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { fetchBooksRequest } from "../features/user/userSlice";
// import { fetchBooksRequest } from "../features/user/userSlice";
import type { RootState } from "../app/store";

const Books: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { users, loading, error } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    // dispatch(fetchBooksRequest());
  }, [dispatch]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Books</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name} - {u.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default Books;
