import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';

import DashboardScreen from '../screens/DashboardScreen';
import StaffDashboardScreen from '../screens/StaffDashboardScreen';
import RaiseComplaintScreen from '../screens/RaiseComplaintScreen';
import ComplaintListScreen from '../screens/ComplaintListScreen';
import ReportScreen from '../screens/ReportScreen';
import DepartmentsScreen from '../screens/master/DepartmentsScreen';
import ProgrammesScreen from '../screens/master/ProgrammesScreen';
import BlocksScreen from '../screens/master/BlocksScreen';
import RoomsScreen from '../screens/master/RoomsScreen';
import RolesScreen from '../screens/master/RolesScreen';
import UsersScreen from '../screens/master/UsersScreen';
import ComplaintTypesScreen from '../screens/master/ComplaintTypesScreen';

const Drawer = createDrawerNavigator();
const MasterStack = createStackNavigator();

const MastersNavigator = () => (
  <MasterStack.Navigator
    screenOptions={{ headerStyle: { backgroundColor: '#007bff' }, headerTintColor: '#fff' }}
  >
    <MasterStack.Screen name="Departments" component={DepartmentsScreen} />
    <MasterStack.Screen name="Programmes" component={ProgrammesScreen} />
    <MasterStack.Screen name="Blocks" component={BlocksScreen} />
    <MasterStack.Screen name="Rooms" component={RoomsScreen} />
    <MasterStack.Screen name="ComplaintTypes" component={ComplaintTypesScreen} options={{ title: 'Complaint Types' }} />
    <MasterStack.Screen name="Roles" component={RolesScreen} />
    <MasterStack.Screen name="Users" component={UsersScreen} />
  </MasterStack.Navigator>
);

const CustomDrawerContent = (props) => {
  const { user, logout } = useAuth();
  const { navigation } = props;

  const handleLogout = () => {
    logout();
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const STAFF_ROLES = ['Staff', 'Networking Staff', 'Plumber', 'Electrician', 'Software Developer', 'Library Staff', 'Cleaning Staff', 'Department Faculty Staff', 'MSc Staff', 'MCA Staff', 'MSc Physics Staff'];
  const isStaff = STAFF_ROLES.includes(user?.role);

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
      {/* User Info Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.drawerUsername}>{user?.username || 'User'}</Text>
        <Text style={styles.drawerRole}>{user?.role || ''}</Text>
      </View>

      {/* Nav Items */}
      <View style={styles.navItems}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.navItemText}>🏠  {isStaff ? 'My Dashboard' : 'Dashboard'}</Text>
        </TouchableOpacity>
        {!isStaff && (
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RaiseComplaint')}>
            <Text style={styles.navItemText}>📝  Raise Complaint</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ComplaintList')}>
          <Text style={styles.navItemText}>📋  {isStaff ? 'My Assigned Tasks' : 'Complaints List'}</Text>
        </TouchableOpacity>
        {isSuperAdmin && (
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.navItemText}>📊  Reports</Text>
          </TouchableOpacity>
        )}
        {isSuperAdmin && (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 }}>
            <Text style={{ fontSize: 13, color: '#888', marginLeft: 20, marginBottom: 5, fontWeight: 'bold' }}>MASTER DATA</Text>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'Departments' })}>
              <Text style={styles.navItemText}>🏢  Departments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'Programmes' })}>
              <Text style={styles.navItemText}>🎓  Programmes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'Blocks' })}>
              <Text style={styles.navItemText}>🏢  Blocks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'Rooms' })}>
              <Text style={styles.navItemText}>🚪  Rooms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'ComplaintTypes' })}>
              <Text style={styles.navItemText}>🏷️  Complaint Types</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'Roles' })}>
              <Text style={styles.navItemText}>🔑  Roles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'Users', params: { roleFilter: 'User' } })}>
              <Text style={styles.navItemText}>👥  Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Masters', { screen: 'Users', params: { roleFilter: 'Staff' } })}>
              <Text style={styles.navItemText}>🧑‍🔧  Manage Staff</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </DrawerContentScrollView>
    {/* Logout Button (Fixed at Bottom) */}
    <View style={styles.logoutContainer}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪  Logout</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const MainNavigator = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const STAFF_ROLES = ['Staff', 'Networking Staff', 'Plumber', 'Electrician', 'Software Developer', 'Library Staff', 'Cleaning Staff', 'Department Faculty Staff', 'MSc Staff', 'MCA Staff', 'MSc Physics Staff'];
  const isStaff = STAFF_ROLES.includes(user?.role);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#007bff' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerStyle: { width: 260 },
      }}
    >
      <Drawer.Screen name="Dashboard" component={isStaff ? StaffDashboardScreen : DashboardScreen} options={{ title: isStaff ? 'Staff Dashboard' : 'Dashboard' }} />
      {isSuperAdmin && (
        <Drawer.Screen name="StaffDashboard" component={StaffDashboardScreen} options={{ title: 'Staff Dashboard' }} />
      )}
      <Drawer.Screen name="RaiseComplaint" component={RaiseComplaintScreen} options={{ title: 'Raise Complaint' }} />
      <Drawer.Screen name="ComplaintList" component={ComplaintListScreen} options={{ title: 'Complaints List' }} />
      {isSuperAdmin && (
        <Drawer.Screen name="Reports" component={ReportScreen} options={{ title: 'Reports' }} />
      )}
      {isSuperAdmin && (
        <Drawer.Screen name="Masters" component={MastersNavigator} options={{ title: 'Masters', headerShown: false }} />
      )}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    backgroundColor: '#007bff',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  drawerUsername: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerRole: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  navItems: {
    flex: 1,
    paddingVertical: 8,
  },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navItemText: {
    fontSize: 15,
    color: '#333',
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutBtn: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default MainNavigator;
