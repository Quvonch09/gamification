import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios'; // Wait, let's use 'axios'
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadStaticData = async (force = false) => {
    if (!token) return;
    if (loaded && !force) return;
    
    setLoading(true);
    try {
      const [groupsRes, coursesRes, mentorsRes] = await Promise.all([
        axios.get('/api/groups'),
        axios.get('/api/courses'),
        axios.get('/api/mentors')
      ]);
      setGroups(groupsRes.data);
      setCourses(coursesRes.data);
      setMentors(mentorsRes.data);
      setLoaded(true);
    } catch (err) {
      console.error("Error loading static data cache", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStaticData();
    } else {
      setGroups([]);
      setCourses([]);
      setMentors([]);
      setLoaded(false);
    }
  }, [token]);

  return (
    <DataContext.Provider value={{ groups, courses, mentors, loading, loaded, refreshData: () => loadStaticData(true) }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
