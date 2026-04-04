-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ENTERED', 'SUBMITTED', 'SCHEDULED', 'FEEDBACK_PROVIDED', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "associated_policy" DROP CONSTRAINT "fk_frsr5s213xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "associated_policy" DROP CONSTRAINT "fk_frsrpas14xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "authentication_execution" DROP CONSTRAINT "fk_auth_exec_flow";

-- DropForeignKey
ALTER TABLE "authentication_execution" DROP CONSTRAINT "fk_auth_exec_realm";

-- DropForeignKey
ALTER TABLE "authentication_flow" DROP CONSTRAINT "fk_auth_flow_realm";

-- DropForeignKey
ALTER TABLE "authenticator_config" DROP CONSTRAINT "fk_auth_realm";

-- DropForeignKey
ALTER TABLE "client_attributes" DROP CONSTRAINT "fk3c47c64beacca966";

-- DropForeignKey
ALTER TABLE "client_initial_access" DROP CONSTRAINT "fk_client_init_acc_realm";

-- DropForeignKey
ALTER TABLE "client_node_registrations" DROP CONSTRAINT "fk4129723ba992f594";

-- DropForeignKey
ALTER TABLE "client_scope_attributes" DROP CONSTRAINT "fk_cl_scope_attr_scope";

-- DropForeignKey
ALTER TABLE "client_scope_role_mapping" DROP CONSTRAINT "fk_cl_scope_rm_scope";

-- DropForeignKey
ALTER TABLE "client_session" DROP CONSTRAINT "fk_b4ao2vcvat6ukau74wbwtfqo1";

-- DropForeignKey
ALTER TABLE "client_session_auth_status" DROP CONSTRAINT "auth_status_constraint";

-- DropForeignKey
ALTER TABLE "client_session_note" DROP CONSTRAINT "fk5edfb00ff51c2736";

-- DropForeignKey
ALTER TABLE "client_session_prot_mapper" DROP CONSTRAINT "fk_33a8sgqw18i532811v7o2dk89";

-- DropForeignKey
ALTER TABLE "client_session_role" DROP CONSTRAINT "fk_11b7sgqw18i532811v7o2dv76";

-- DropForeignKey
ALTER TABLE "client_user_session_note" DROP CONSTRAINT "fk_cl_usr_ses_note";

-- DropForeignKey
ALTER TABLE "component" DROP CONSTRAINT "fk_component_realm";

-- DropForeignKey
ALTER TABLE "component_config" DROP CONSTRAINT "fk_component_config";

-- DropForeignKey
ALTER TABLE "composite_role" DROP CONSTRAINT "fk_a63wvekftu8jo1pnj81e7mce2";

-- DropForeignKey
ALTER TABLE "composite_role" DROP CONSTRAINT "fk_gr7thllb9lu8q4vqa4524jjy8";

-- DropForeignKey
ALTER TABLE "credential" DROP CONSTRAINT "fk_pfyr0glasqyl0dei3kl69r6v0";

-- DropForeignKey
ALTER TABLE "default_client_scope" DROP CONSTRAINT "fk_r_def_cli_scope_realm";

-- DropForeignKey
ALTER TABLE "federated_identity" DROP CONSTRAINT "fk404288b92ef007a6";

-- DropForeignKey
ALTER TABLE "group_attribute" DROP CONSTRAINT "fk_group_attribute_group";

-- DropForeignKey
ALTER TABLE "group_role_mapping" DROP CONSTRAINT "fk_group_role_group";

-- DropForeignKey
ALTER TABLE "identity_provider" DROP CONSTRAINT "fk2b4ebc52ae5c3b34";

-- DropForeignKey
ALTER TABLE "identity_provider_config" DROP CONSTRAINT "fkdc4897cf864c4e43";

-- DropForeignKey
ALTER TABLE "identity_provider_mapper" DROP CONSTRAINT "fk_idpm_realm";

-- DropForeignKey
ALTER TABLE "idp_mapper_config" DROP CONSTRAINT "fk_idpmconfig";

-- DropForeignKey
ALTER TABLE "keycloak_role" DROP CONSTRAINT "fk_6vyqfe4cn4wlq8r6kt5vdsj5c";

-- DropForeignKey
ALTER TABLE "policy_config" DROP CONSTRAINT "fkdc34197cf864c4e43";

-- DropForeignKey
ALTER TABLE "protocol_mapper" DROP CONSTRAINT "fk_cli_scope_mapper";

-- DropForeignKey
ALTER TABLE "protocol_mapper" DROP CONSTRAINT "fk_pcm_realm";

-- DropForeignKey
ALTER TABLE "protocol_mapper_config" DROP CONSTRAINT "fk_pmconfig";

-- DropForeignKey
ALTER TABLE "realm_attribute" DROP CONSTRAINT "fk_8shxd6l3e9atqukacxgpffptw";

-- DropForeignKey
ALTER TABLE "realm_default_groups" DROP CONSTRAINT "fk_def_groups_realm";

-- DropForeignKey
ALTER TABLE "realm_enabled_event_types" DROP CONSTRAINT "fk_h846o4h0w8epx5nwedrf5y69j";

-- DropForeignKey
ALTER TABLE "realm_events_listeners" DROP CONSTRAINT "fk_h846o4h0w8epx5nxev9f5y69j";

-- DropForeignKey
ALTER TABLE "realm_required_credential" DROP CONSTRAINT "fk_5hg65lybevavkqfki3kponh9v";

-- DropForeignKey
ALTER TABLE "realm_smtp_config" DROP CONSTRAINT "fk_70ej8xdxgxd0b9hh6180irr0o";

-- DropForeignKey
ALTER TABLE "realm_supported_locales" DROP CONSTRAINT "fk_supported_locales_realm";

-- DropForeignKey
ALTER TABLE "redirect_uris" DROP CONSTRAINT "fk_1burs8pb4ouj97h5wuppahv9f";

-- DropForeignKey
ALTER TABLE "required_action_provider" DROP CONSTRAINT "fk_req_act_realm";

-- DropForeignKey
ALTER TABLE "resource_attribute" DROP CONSTRAINT "fk_5hrm2vlf9ql5fu022kqepovbr";

-- DropForeignKey
ALTER TABLE "resource_policy" DROP CONSTRAINT "fk_frsrpos53xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_policy" DROP CONSTRAINT "fk_frsrpp213xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_scope" DROP CONSTRAINT "fk_frsrpos13xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_scope" DROP CONSTRAINT "fk_frsrps213xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_server_perm_ticket" DROP CONSTRAINT "fk_frsrho213xcx4wnkog82sspmt";

-- DropForeignKey
ALTER TABLE "resource_server_perm_ticket" DROP CONSTRAINT "fk_frsrho213xcx4wnkog83sspmt";

-- DropForeignKey
ALTER TABLE "resource_server_perm_ticket" DROP CONSTRAINT "fk_frsrho213xcx4wnkog84sspmt";

-- DropForeignKey
ALTER TABLE "resource_server_perm_ticket" DROP CONSTRAINT "fk_frsrpo2128cx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_server_policy" DROP CONSTRAINT "fk_frsrpo213xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_server_resource" DROP CONSTRAINT "fk_frsrho213xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_server_scope" DROP CONSTRAINT "fk_frsrso213xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "resource_uris" DROP CONSTRAINT "fk_resource_server_uris";

-- DropForeignKey
ALTER TABLE "role_attribute" DROP CONSTRAINT "fk_role_attribute_id";

-- DropForeignKey
ALTER TABLE "scope_mapping" DROP CONSTRAINT "fk_ouse064plmlr732lxjcn1q5f1";

-- DropForeignKey
ALTER TABLE "scope_policy" DROP CONSTRAINT "fk_frsrasp13xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "scope_policy" DROP CONSTRAINT "fk_frsrpass3xcx4wnkog82ssrfy";

-- DropForeignKey
ALTER TABLE "user_attribute" DROP CONSTRAINT "fk_5hrm2vlf9ql5fu043kqepovbr";

-- DropForeignKey
ALTER TABLE "user_consent" DROP CONSTRAINT "fk_grntcsnt_user";

-- DropForeignKey
ALTER TABLE "user_consent_client_scope" DROP CONSTRAINT "fk_grntcsnt_clsc_usc";

-- DropForeignKey
ALTER TABLE "user_federation_config" DROP CONSTRAINT "fk_t13hpu1j94r2ebpekr39x5eu5";

-- DropForeignKey
ALTER TABLE "user_federation_mapper" DROP CONSTRAINT "fk_fedmapperpm_fedprv";

-- DropForeignKey
ALTER TABLE "user_federation_mapper" DROP CONSTRAINT "fk_fedmapperpm_realm";

-- DropForeignKey
ALTER TABLE "user_federation_mapper_config" DROP CONSTRAINT "fk_fedmapper_cfg";

-- DropForeignKey
ALTER TABLE "user_federation_provider" DROP CONSTRAINT "fk_1fj32f6ptolw2qy60cd8n01e8";

-- DropForeignKey
ALTER TABLE "user_group_membership" DROP CONSTRAINT "fk_user_group_user";

-- DropForeignKey
ALTER TABLE "user_required_action" DROP CONSTRAINT "fk_6qj3w1jw9cvafhe19bwsiuvmd";

-- DropForeignKey
ALTER TABLE "user_role_mapping" DROP CONSTRAINT "fk_c4fqv34p1mbylloxang7b1q3l";

-- DropForeignKey
ALTER TABLE "user_session_note" DROP CONSTRAINT "fk5edfb00ff51d3472";

-- DropForeignKey
ALTER TABLE "web_origins" DROP CONSTRAINT "fk_lojpho213xcx4wnkog82ssrfy";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "interviewDate" TIMESTAMP(3),
ADD COLUMN     "interviewLink" TEXT,
ADD COLUMN     "interviewerId" TEXT,
ADD COLUMN     "status" "AgentStatus" NOT NULL DEFAULT 'ENTERED';

-- DropTable
DROP TABLE "admin_event_entity";

-- DropTable
DROP TABLE "associated_policy";

-- DropTable
DROP TABLE "authentication_execution";

-- DropTable
DROP TABLE "authentication_flow";

-- DropTable
DROP TABLE "authenticator_config";

-- DropTable
DROP TABLE "authenticator_config_entry";

-- DropTable
DROP TABLE "broker_link";

-- DropTable
DROP TABLE "client";

-- DropTable
DROP TABLE "client_attributes";

-- DropTable
DROP TABLE "client_auth_flow_bindings";

-- DropTable
DROP TABLE "client_initial_access";

-- DropTable
DROP TABLE "client_node_registrations";

-- DropTable
DROP TABLE "client_scope";

-- DropTable
DROP TABLE "client_scope_attributes";

-- DropTable
DROP TABLE "client_scope_client";

-- DropTable
DROP TABLE "client_scope_role_mapping";

-- DropTable
DROP TABLE "client_session";

-- DropTable
DROP TABLE "client_session_auth_status";

-- DropTable
DROP TABLE "client_session_note";

-- DropTable
DROP TABLE "client_session_prot_mapper";

-- DropTable
DROP TABLE "client_session_role";

-- DropTable
DROP TABLE "client_user_session_note";

-- DropTable
DROP TABLE "component";

-- DropTable
DROP TABLE "component_config";

-- DropTable
DROP TABLE "composite_role";

-- DropTable
DROP TABLE "credential";

-- DropTable
DROP TABLE "databasechangelog";

-- DropTable
DROP TABLE "databasechangeloglock";

-- DropTable
DROP TABLE "default_client_scope";

-- DropTable
DROP TABLE "event_entity";

-- DropTable
DROP TABLE "fed_user_attribute";

-- DropTable
DROP TABLE "fed_user_consent";

-- DropTable
DROP TABLE "fed_user_consent_cl_scope";

-- DropTable
DROP TABLE "fed_user_credential";

-- DropTable
DROP TABLE "fed_user_group_membership";

-- DropTable
DROP TABLE "fed_user_required_action";

-- DropTable
DROP TABLE "fed_user_role_mapping";

-- DropTable
DROP TABLE "federated_identity";

-- DropTable
DROP TABLE "federated_user";

-- DropTable
DROP TABLE "group_attribute";

-- DropTable
DROP TABLE "group_role_mapping";

-- DropTable
DROP TABLE "identity_provider";

-- DropTable
DROP TABLE "identity_provider_config";

-- DropTable
DROP TABLE "identity_provider_mapper";

-- DropTable
DROP TABLE "idp_mapper_config";

-- DropTable
DROP TABLE "keycloak_group";

-- DropTable
DROP TABLE "keycloak_role";

-- DropTable
DROP TABLE "migration_model";

-- DropTable
DROP TABLE "offline_client_session";

-- DropTable
DROP TABLE "offline_user_session";

-- DropTable
DROP TABLE "policy_config";

-- DropTable
DROP TABLE "protocol_mapper";

-- DropTable
DROP TABLE "protocol_mapper_config";

-- DropTable
DROP TABLE "realm";

-- DropTable
DROP TABLE "realm_attribute";

-- DropTable
DROP TABLE "realm_default_groups";

-- DropTable
DROP TABLE "realm_enabled_event_types";

-- DropTable
DROP TABLE "realm_events_listeners";

-- DropTable
DROP TABLE "realm_localizations";

-- DropTable
DROP TABLE "realm_required_credential";

-- DropTable
DROP TABLE "realm_smtp_config";

-- DropTable
DROP TABLE "realm_supported_locales";

-- DropTable
DROP TABLE "redirect_uris";

-- DropTable
DROP TABLE "required_action_config";

-- DropTable
DROP TABLE "required_action_provider";

-- DropTable
DROP TABLE "resource_attribute";

-- DropTable
DROP TABLE "resource_policy";

-- DropTable
DROP TABLE "resource_scope";

-- DropTable
DROP TABLE "resource_server";

-- DropTable
DROP TABLE "resource_server_perm_ticket";

-- DropTable
DROP TABLE "resource_server_policy";

-- DropTable
DROP TABLE "resource_server_resource";

-- DropTable
DROP TABLE "resource_server_scope";

-- DropTable
DROP TABLE "resource_uris";

-- DropTable
DROP TABLE "role_attribute";

-- DropTable
DROP TABLE "scope_mapping";

-- DropTable
DROP TABLE "scope_policy";

-- DropTable
DROP TABLE "user_attribute";

-- DropTable
DROP TABLE "user_consent";

-- DropTable
DROP TABLE "user_consent_client_scope";

-- DropTable
DROP TABLE "user_entity";

-- DropTable
DROP TABLE "user_federation_config";

-- DropTable
DROP TABLE "user_federation_mapper";

-- DropTable
DROP TABLE "user_federation_mapper_config";

-- DropTable
DROP TABLE "user_federation_provider";

-- DropTable
DROP TABLE "user_group_membership";

-- DropTable
DROP TABLE "user_required_action";

-- DropTable
DROP TABLE "user_role_mapping";

-- DropTable
DROP TABLE "user_session";

-- DropTable
DROP TABLE "user_session_note";

-- DropTable
DROP TABLE "username_login_failure";

-- DropTable
DROP TABLE "web_origins";

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Answer_agentId_questionId_key" ON "Answer"("agentId", "questionId");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

