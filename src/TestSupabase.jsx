import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function TestSupabase() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from("users").select("*");
      if (error) console.error("Error:", error);
      else setUsers(data);
    }
    fetchData();
  }, []);

  return (
    <div>
      <h2>Supabase Test Connection ✅</h2>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
