// pages/some-data-page.tsx (예시)
import { useEffect, useState } from 'react';
import { supabase } from '@/services/shared/supabase';

interface Todo {
  id: number;
  task: string;
  is_complete: boolean;
}

export default function SomeDataPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('todos').select('*');
      if (error) throw error;
      setTodos(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ task: newTask, is_complete: false }]);
      if (error) throw error;
      setNewTask('');
      fetchTodos(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading todos...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h1>My Supabase Todos</h1>
      <input
        type="text"
        placeholder="New task"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
      />
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.task} - {todo.is_complete ? 'Complete' : 'Pending'}
          </li>
        ))}
      </ul>
    </div>
  );
}
