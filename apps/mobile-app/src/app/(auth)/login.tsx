import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // TODO: Implement OIDC login flow with Keycloak
    // Simulated token storage for testing persistent login
    await login({ 
      access_token: 'fake-access-token-' + Date.now(),
      refresh_token: 'fake-refresh-token-' + Date.now()
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            {/* Using a placeholder for the logo */}
            <View style={styles.logoPlaceholder}>
               <Text style={styles.logoText}>GD</Text>
            </View>
            <Text style={styles.brandTitle}>Globus Dei</Text>
            <Text style={styles.brandSubtitle}>Conectando missões globalmente</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialSection}>
               <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>Google</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.socialButton}>
                  <Text style={styles.socialButtonText}>LinkedIn</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.signupSection}>
               <Text style={styles.signupText}>Ainda não tem conta? </Text>
               <TouchableOpacity>
                  <Text style={styles.signupLink}>Criar agora</Text>
               </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#8d472e',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8d472e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8d472e',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'serif',
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    color: '#111827',
    fontSize: 16,
    marginBottom: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  forgotPasswordText: {
    color: '#8d472e',
    fontWeight: '500',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#8d472e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8d472e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  socialButton: {
    flex: 0.48,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  socialButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#8d472e',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
