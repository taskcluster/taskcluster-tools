/**
 * Role-Scope Patterns,
 *
 * This document specifies role-scope patterns that can be granted and listed
 * using the ScopeGrants tool, along with a usable description.
 *
 * WARNING: Modifying these patterns can cause maintenance nightmares and
 *          configuration inconsistencies.
 *
 * If a pattern is changed here, the following will cause pain:
 *  A) the existing grants will NOT be automatically updated (obviously).
 *  B) The ScopeGrants tool will NOT be able to list existing grants.
 *
 * (A) is annoying as it means that existing grants have to be manually
 * granted again. This is further complicated by (B) as we can't see the
 * existing grants anymore. Thus, we risk:
 *  i)  scope configuration inconsistencies (if some grants aren't re-granted)
 *  ii) old grants go hidden and are hard to find, causing security concerns.
 *
 * TODO: Allow patterns to specify revisions of the {params, grants} properties.
 *       Example: {revisions: [{params, grants}, {params, grants}, ...]}
 *       Where last entry is the current parameters and role-scope patterns,
 *       this way the UI could be augmented to list old grants and facilitate
 *       easy upgrades to the newest pattern; even if new parameters are
 *       introduced.
 *
 * Note: Even with the above addition, there is still a slight risk of people
 *       inconsistencies if one scope-role pattern is a strict subset of another
 *       and the grant is revoked using the wrong UI.
 */
export default [
  // READ ABOVE BEFORE MAKING CHANGES
  {
    name: 'authorize-github-organizations',
    icon: 'github',
    title: 'Authorize Github Organizations',
    description: `
Authorize **all** repositories under a github organization to use taskcluster.

By default any the tascluster-github application can be installed on any github
organization/repository. However, github repositories are not granted any scopes
by default, so even if the repository contains have a \`.taskcluster.yml\`,
tasks won't be triggered.

To make it easy to get started with a new github organization, this pattern
grants \`assume:project:taskcluster:mozilla-github-repository\` to all
repositories under a given organization. This role grants the repositories a
reasonable set of low-privileged scopes to get people started.
    `,
    params: {
      organization: /^[a-zA-Z0-9_-]+$/
    },
    grants: {
      'repo:github.com/<organization>/*': [
        'assume:project:taskcluster:mozilla-github-repository'
      ]
    }
  }
];
