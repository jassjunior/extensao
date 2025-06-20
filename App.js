import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Alert } from 'react-native';

import Dashboard from './screens/Dashboard';
import Students from './screens/Students';
import Payments from './screens/Payments';
import Attendance from './screens/Attendance';
import Itineraries from './screens/Itineraries';
import dbService from './services/dbService';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await dbService.init();
        console.log('Banco de dados inicializado com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
        Alert.alert('Erro', 'Falha ao inicializar o banco de dados');
      }
    };

    initializeApp();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: styles.tabBar,
          headerStyle: styles.header,
          headerTintColor: '#ffffff',
          headerTitleStyle: styles.headerTitle,
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={Dashboard}
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Início',
            tabBarIcon: () => '📊',
          }}
        />
        <Tab.Screen 
          name="Students" 
          component={Students}
          options={{
            title: 'Gerenciar Alunos',
            tabBarLabel: 'Alunos',
            tabBarIcon: () => '👥',
          }}
        />
        <Tab.Screen 
          name="Payments" 
          component={Payments}
          options={{
            title: 'Gerenciar Pagamentos',
            tabBarLabel: 'Pagamentos',
            tabBarIcon: () => '💰',
          }}
        />
        <Tab.Screen 
          name="Attendance" 
          component={Attendance}
          options={{
            title: 'Gerenciar Frequência',
            tabBarLabel: 'Frequência',
            tabBarIcon: () => '📋',
          }}
        />
        <Tab.Screen 
          name="Itineraries" 
          component={Itineraries}
          options={{
            title: 'Roteiros de Estudo',
            tabBarLabel: 'Roteiros',
            tabBarIcon: () => '📚',
          }}
        />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  header: {
    backgroundColor: '#3b82f6',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

