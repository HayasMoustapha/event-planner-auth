#!/usr/bin/env python3
"""
Script de test complet pour l'inscription d'utilisateurs
Teste le flux complet: inscription -> vérification OTP -> login
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:3000"  # Modifier si le port est différent
TEST_EMAIL = f"testuser_{int(time.time())}@example.com"
TEST_PASSWORD = "TestPassword123!"

class RegistrationTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_data = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Affiche un message de log avec timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_registration(self) -> Dict[str, Any]:
        """Teste l'inscription d'un nouvel utilisateur"""
        self.log("Début du test d'inscription")
        
        registration_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "phone": "+33612345678"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            self.log(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.test_data = result.get("data", {})
                    self.log("✅ Inscription réussie")
                    return result
                else:
                    self.log(f"❌ Erreur inscription: {result.get('message')}")
                    return result
            else:
                self.log(f"❌ Erreur HTTP: {response.status_code}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            self.log(f"❌ Exception inscription: {str(e)}", "ERROR")
            return {"success": False, "error": str(e)}
    
    def test_email_verification(self) -> Dict[str, Any]:
        """Teste la vérification de l'email avec OTP"""
        self.log("Début du test de vérification email")
        
        # Pour le test, nous allons essayer de récupérer l'OTP depuis la base de données
        # En production, l'utilisateur recevrait l'OTP par email
        try:
            # Simuler la récupération de l'OTP (en production, l'utilisateur le recevrait par email)
            otp_code = "123456"  # Code de test
            
            verification_data = {
                "email": TEST_EMAIL,
                "otp_code": otp_code
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/verify-email",
                json=verification_data,
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            self.log(f"Response: {response.text}")
            
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
    
    def test_login(self) -> Dict[str, Any]:
        """Teste la connexion de l'utilisateur"""
        self.log("Début du test de connexion")
        
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            self.log(f"Response: {response.text}")
            
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
    
    def test_resend_otp(self) -> Dict[str, Any]:
        """Teste le renvoi d'OTP"""
        self.log("Début du test de renvoi OTP")
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/resend-otp",
                json={"email": TEST_EMAIL},
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            self.log(f"Response: {response.text}")
            
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
        self.log("Début du test d'endpoint protégé")
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/users/profile",
                headers={"Content-Type": "application/json"}
            )
            
            self.log(f"Status Code: {response.status_code}")
            self.log(f"Response: {response.text}")
            
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
                    "password": TEST_PASSWORD
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
                "name": "Email invalide",
                "data": {
                    "first_name": "Test",
                    "last_name": "User",
                    "email": "invalid-email",
                    "password": TEST_PASSWORD
                },
                "expected_error": "Format d'email invalide"
            },
            {
                "name": "Email déjà utilisé",
                "data": {
                    "first_name": "Test",
                    "last_name": "User",
                    "email": TEST_EMAIL,  # Même email que le test principal
                    "password": TEST_PASSWORD
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
                
                if case.get("expected_error") and case["expected_error"] in str(result.get("message", "")):
                    self.log(f"✅ Cas {case['name']}: Erreur attendue détectée")
                    results.append({"case": case["name"], "success": True})
                else:
                    self.log(f"❌ Cas {case['name']}: Erreur inattendue")
                    results.append({"case": case["name"], "success": False, "result": result})
                    
            except Exception as e:
                self.log(f"❌ Cas {case['name']}: Exception - {str(e)}", "ERROR")
                results.append({"case": case["name"], "success": False, "error": str(e)})
        
        return {"edge_cases": results}
    
    def run_complete_test(self) -> Dict[str, Any]:
        """Exécute le test complet du flux d'inscription"""
        self.log("=" * 50)
        self.log("DÉBUT DU TEST COMPLET D'INSCRIPTION")
        self.log("=" * 50)
        
        results = {
            "test_email": TEST_EMAIL,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "steps": {}
        }
        
        # Étape 1: Inscription
        registration_result = self.test_registration()
        results["steps"]["registration"] = {
            "success": registration_result.get("success", False),
            "result": registration_result
        }
        
        if not registration_result.get("success"):
            self.log("❌ Échec de l'inscription, arrêt du test")
            return results
        
        # Étape 2: Test des cas limites
        edge_cases_result = self.test_edge_cases()
        results["steps"]["edge_cases"] = edge_cases_result
        
        # Étape 3: Tentative de connexion (devrait échouer car email non vérifié)
        login_before_verification = self.test_login()
        results["steps"]["login_before_verification"] = {
            "success": login_before_verification.get("success", False),
            "result": login_before_verification
        }
        
        # Étape 4: Vérification email (simulation)
        verification_result = self.test_email_verification()
        results["steps"]["verification"] = {
            "success": verification_result.get("success", False),
            "result": verification_result
        }
        
        # Étape 5: Connexion après vérification
        login_after_verification = self.test_login()
        results["steps"]["login_after_verification"] = {
            "success": login_after_verification.get("success", False),
            "result": login_after_verification
        }
        
        # Étape 6: Test endpoint protégé
        if login_after_verification.get("success"):
            protected_result = self.test_protected_endpoint()
            results["steps"]["protected_endpoint"] = {
                "success": protected_result.get("success", False),
                "result": protected_result
            }
        
        # Étape 7: Test renvoi OTP
        resend_result = self.test_resend_otp()
        results["steps"]["resend_otp"] = {
            "success": resend_result.get("success", False),
            "result": resend_result
        }
        
        # Résumé
        successful_steps = sum(1 for step in results["steps"].values() if step.get("success", False))
        total_steps = len(results["steps"])
        
        self.log("=" * 50)
        self.log("RÉSUMÉ DU TEST")
        self.log("=" * 50)
        self.log(f"Étapes réussies: {successful_steps}/{total_steps}")
        self.log(f"Email de test: {TEST_EMAIL}")
        
        if successful_steps == total_steps:
            self.log("🎉 TOUS LES TESTS RÉUSSIS!")
        else:
            self.log("⚠️  CERTAINS TESTS ONT ÉCHOUÉ")
        
        results["summary"] = {
            "successful_steps": successful_steps,
            "total_steps": total_steps,
            "success_rate": f"{(successful_steps/total_steps)*100:.1f}%"
        }
        
        return results

def main():
    """Fonction principale"""
    print("🧪 Script de test d'inscription Event Planner Auth")
    print("=" * 50)
    
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
    
    # Lancer les tests
    tester = RegistrationTester(BASE_URL)
    results = tester.run_complete_test()
    
    # Sauvegarder les résultats dans un fichier
    results_file = f"test_results_{int(time.time())}.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Résultats détaillés sauvegardés dans: {results_file}")
    
    # Code de sortie basé sur le succès
    success_rate = float(results["summary"]["success_rate"].rstrip('%'))
    sys.exit(0 if success_rate >= 80 else 1)

if __name__ == "__main__":
    main()
