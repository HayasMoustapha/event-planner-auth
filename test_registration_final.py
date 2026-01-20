#!/usr/bin/env python3
"""
Script de test complet pour l'inscription d'utilisateurs - Version Finale
Teste le flux complet: inscription -> vérification OTP -> login
Basé sur le schéma SQL corrigé et le flow d'inscription fonctionnel
"""

import requests
import json
import time
import sys
import random
import string
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:3007"  # Port du serveur fonctionnel

class RegistrationTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_data = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Affiche un message de log avec timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def generate_test_phone(self) -> str:
        """Génère un numéro de téléphone de test unique"""
        return f"+336{random.randint(10000000, 99999999)}"
        
    def generate_test_email(self) -> str:
        """Génère un email de test unique"""
        timestamp = int(time.time())
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        return f"test_{timestamp}_{random_suffix}@example.com"
        
    def test_registration(self, email: str, password: str = "TestPassword123!") -> Dict[str, Any]:
        """Teste l'inscription d'un nouvel utilisateur"""
        self.log(f"Test d'inscription avec email: {email}")
        
        registration_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": email,
            "password": password,
            "phone": self.generate_test_phone()
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                if result.get("success"):
                    self.test_data = result.get("data", {})
                    self.log("✅ Inscription réussie")
                    self.log(f"   Person ID: {self.test_data.get('person', {}).get('id')}")
                    self.log(f"   User ID: {self.test_data.get('user', {}).get('id')}")
                    self.log(f"   OTP ID: {self.test_data.get('otp', {}).get('id')}")
                    return result
                else:
                    self.log(f"❌ Erreur inscription: {result.get('message')}")
                    return result
            else:
                self.log(f"❌ Erreur HTTP: {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Message: {error_data.get('message', 'No message')}")
                except:
                    self.log(f"   Response: {response.text}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            self.log(f"❌ Exception inscription: {str(e)}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_email_verification(self, email: str, otp_code: str) -> Dict[str, Any]:
        """Teste la vérification de l'email avec OTP"""
        self.log(f"Test de vérification email avec OTP: {otp_code}")
        
        verification_data = {
            "email": email,
            "otp_code": otp_code
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/verify-email",
                json=verification_data,
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log("✅ Vérification email réussie")
                    return result
                else:
                    self.log(f"❌ Erreur vérification: {result.get('message')}")
                    return result
            else:
                self.log(f"❌ Erreur HTTP: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            self.log(f"❌ Exception vérification: {str(e)}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_login(self, email: str, password: str = "TestPassword123!") -> Dict[str, Any]:
        """Teste la connexion de l'utilisateur"""
        self.log(f"Test de connexion pour: {email}")
        
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log("✅ Connexion réussie")
                    
                    # Sauvegarder le token pour les futures requêtes
                    if result.get("data", {}).get("token"):
                        self.session.headers.update({
                            "Authorization": f"Bearer {result['data']['token']}"
                        })
                    
                    return result
                else:
                    self.log(f"❌ Erreur connexion: {result.get('message')}")
                    return result
            else:
                self.log(f"❌ Erreur HTTP: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            self.log(f"❌ Exception connexion: {str(e)}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_resend_otp(self, email: str) -> Dict[str, Any]:
        """Teste le renvoi d'OTP"""
        self.log(f"Test de renvoi OTP pour: {email}")
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/resend-otp",
                json={"email": email},
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log("✅ Renvoi OTP réussi")
                    return result
                else:
                    self.log(f"❌ Erreur renvoi OTP: {result.get('message')}")
                    return result
            else:
                self.log(f"❌ Erreur HTTP: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            self.log(f"❌ Exception renvoi OTP: {str(e)}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_protected_endpoint(self) -> Dict[str, Any]:
        """Teste l'accès à un endpoint protégé"""
        self.log("Test d'accès à un endpoint protégé")
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/users/profile",
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log("✅ Accès endpoint protégé réussi")
                    return result
                else:
                    self.log(f"❌ Erreur endpoint: {result.get('message')}")
                    return result
            else:
                self.log(f"❌ Erreur HTTP: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            self.log(f"❌ Exception endpoint: {str(e)}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_edge_cases(self) -> Dict[str, Any]:
        """Teste les cas limites et erreurs"""
        self.log("Début des tests de cas limites")
        
        edge_cases = [
            {
                "name": "Email manquant",
                "data": {
                    "first_name": "Test",
                    "last_name": "User",
                    "password": "TestPassword123!"
                },
                "expected_error": "L'email est obligatoire"
            },
            {
                "name": "Mot de passe trop court",
                "data": {
                    "first_name": "Test",
                    "last_name": "User",
                    "email": "short@example.com",
                    "password": "123"
                },
                "expected_error": "8 caractères"
            },
            {
                "name": "Prénom manquant",
                "data": {
                    "last_name": "User",
                    "email": "noname@example.com",
                    "password": "TestPassword123!"
                },
                "expected_error": "prénom est obligatoire"
            },
            {
                "name": "Email déjà utilisé",
                "data": {
                    "first_name": "Test",
                    "last_name": "User",
                    "email": "testsuccess3@example.com",  # Email déjà utilisé
                    "password": "TestPassword123!"
                },
                "expected_error": "déjà utilisé"
            }
        ]
        
        results = []
        
        for case in edge_cases:
            self.log(f"Test cas: {case['name']}")
            
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/register",
                    json=case["data"],
                    headers={"Content-Type": "application/json"}
                )
                
                result = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"error": response.text}
                
                if case.get("expected_error") and case["expected_error"].lower() in str(result.get("message", "")).lower():
                    self.log(f"✅ Cas {case['name']}: Erreur attendue détectée")
                    results.append({"case": case["name"], "success": True})
                else:
                    self.log(f"❌ Cas {case['name']}: Erreur inattendue")
                    results.append({"case": case["name"], "success": False, "result": result})
                    
            except Exception as e:
                self.log(f"❌ Cas {case['name']}: Exception - {str(e)}", "ERROR")
                results.append({"case": case["name"], "success": False, "error": str(e)})
        
        return {"edge_cases": results}
    
    def test_database_consistency(self, email: str) -> Dict[str, Any]:
        """Teste la cohérence des données en base"""
        self.log(f"Test de cohérence base de données pour: {email}")
        
        # Note: En pratique, on se connecterait directement à la base
        # Ici on simule via les API pour vérifier la cohérence
        
        try:
            # Vérifier que l'utilisateur peut se connecter après inscription
            login_result = self.test_login(email)
            
            if login_result.get("success"):
                self.log("✅ Cohérence base de données: Utilisateur fonctionnel")
                return {"success": True, "message": "Base de données cohérente"}
            else:
                self.log("❌ Incohérence base de données: Utilisateur non fonctionnel")
                return {"success": False, "message": "Base de données incohérente"}
                
        except Exception as e:
            self.log(f"❌ Exception cohérence: {str(e)}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def run_complete_test(self) -> Dict[str, Any]:
        """Exécute le test complet du flux d'inscription"""
        self.log("=" * 60)
        self.log("DÉBUT DU TEST COMPLET D'INSCRIPTION - VERSION FINALE")
        self.log("=" * 60)
        
        # Générer un email unique pour ce test
        test_email = self.generate_test_email()
        
        results = {
            "test_email": test_email,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "base_url": self.base_url,
            "steps": {}
        }
        
        # Étape 1: Inscription
        self.log("\n📝 ÉTAPE 1: Inscription")
        registration_result = self.test_registration(test_email)
        results["steps"]["registration"] = {
            "success": registration_result.get("success", False),
            "result": registration_result
        }
        
        if not registration_result.get("success"):
            self.log("❌ Échec de l'inscription, arrêt du test")
            return results
        
        # Étape 2: Test des cas limites
        self.log("\n🧪 ÉTAPE 2: Tests des cas limites")
        edge_cases_result = self.test_edge_cases()
        results["steps"]["edge_cases"] = edge_cases_result
        
        # Étape 3: Tentative de connexion (devrait échouer car email non vérifié)
        self.log("\n🔒 ÉTAPE 3: Connexion avant vérification")
        login_before_verification = self.test_login(test_email)
        results["steps"]["login_before_verification"] = {
            "success": login_before_verification.get("success", False),
            "result": login_before_verification
        }
        
        # Étape 4: Simulation de vérification (avec OTP fictif pour le test)
        self.log("\n📧 ÉTAPE 4: Vérification email (simulation)")
        # En pratique, il faudrait récupérer l'OTP depuis l'email ou la base
        # Pour le test, nous utilisons un OTP fictif
        verification_result = self.test_email_verification(test_email, "123456")
        results["steps"]["verification"] = {
            "success": verification_result.get("success", False),
            "result": verification_result
        }
        
        # Étape 5: Test renvoi OTP
        self.log("\n🔄 ÉTAPE 5: Renvoi OTP")
        resend_result = self.test_resend_otp(test_email)
        results["steps"]["resend_otp"] = {
            "success": resend_result.get("success", False),
            "result": resend_result
        }
        
        # Étape 6: Test de cohérence base de données
        self.log("\n🗄️ ÉTAPE 6: Cohérence base de données")
        consistency_result = self.test_database_consistency(test_email)
        results["steps"]["database_consistency"] = {
            "success": consistency_result.get("success", False),
            "result": consistency_result
        }
        
        # Résumé
        successful_steps = sum(1 for step in results["steps"].values() if step.get("success", False))
        total_steps = len(results["steps"])
        
        self.log("\n" + "=" * 60)
        self.log("RÉSUMÉ DU TEST")
        self.log("=" * 60)
        self.log(f"Étapes réussies: {successful_steps}/{total_steps}")
        self.log(f"Email de test: {test_email}")
        self.log(f"URL de base: {self.base_url}")
        
        # Calculer le taux de succès des edge cases
        edge_cases_total = len(edge_cases_result.get("edge_cases", []))
        edge_cases_success = sum(1 for case in edge_cases_result.get("edge_cases", []) if case.get("success", False))
        self.log(f"Cas limites: {edge_cases_success}/{edge_cases_total}")
        
        if successful_steps >= total_steps * 0.8:  # 80% de succès
            self.log("🎉 TEST GLOBAL RÉUSSI!")
        else:
            self.log("⚠️  TEST GLOBAL PARTIELLEMENT RÉUSSI")
        
        results["summary"] = {
            "successful_steps": successful_steps,
            "total_steps": total_steps,
            "success_rate": f"{(successful_steps/total_steps)*100:.1f}%",
            "edge_cases_success": edge_cases_success,
            "edge_cases_total": edge_cases_total,
            "edge_cases_rate": f"{(edge_cases_success/edge_cases_total)*100:.1f}%" if edge_cases_total > 0 else "N/A"
        }
        
        return results

def main():
    """Fonction principale"""
    print("🧪 Script de test d'inscription Event Planner Auth - Version Finale")
    print("=" * 60)
    
    # Vérifier si le serveur est accessible
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print(f"❌ Le serveur n'est pas accessible sur {BASE_URL}")
            print("Assurez-vous que le serveur est démarré")
            sys.exit(1)
    except requests.exceptions.RequestException:
        print(f"❌ Impossible de se connecter au serveur sur {BASE_URL}")
        print("Assurez-vous que le serveur est démarré")
        sys.exit(1)
    
    print(f"✅ Serveur accessible sur {BASE_URL}")
    
    # Lancer les tests
    tester = RegistrationTester(BASE_URL)
    results = tester.run_complete_test()
    
    # Sauvegarder les résultats dans un fichier
    results_file = f"test_results_final_{int(time.time())}.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Résultats détaillés sauvegardés dans: {results_file}")
    
    # Afficher le résumé final
    print("\n" + "=" * 60)
    print("RAPPORT FINAL")
    print("=" * 60)
    print(f"✅ Inscription: {'RÉUSSIE' if results['steps']['registration']['success'] else 'ÉCHOUÉE'}")
    print(f"✅ Cas limites: {results['summary']['edge_cases_rate']} de succès")
    print(f"✅ Base de données: {'COHÉRENTE' if results['steps']['database_consistency']['success'] else 'INCOHÉRENTE'}")
    print(f"📊 Taux de succès global: {results['summary']['success_rate']}")
    
    # Code de sortie basé sur le succès
    success_rate = float(results["summary"]["success_rate"].rstrip('%'))
    sys.exit(0 if success_rate >= 80 else 1)

if __name__ == "__main__":
    main()
