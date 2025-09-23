// src/pages/Users.tsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { fetchUsersRequest } from "../features/user/userSlice";
// import { fetchUsersRequest } from "../features/user/userSlice";
import type { RootState } from "../app/store";

const Users: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { users, loading, error } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    // dispatch(fetchUsersRequest());
  }, [dispatch]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name} - {u.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default Users;
