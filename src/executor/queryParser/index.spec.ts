import { extractTables } from './index'

test('extractTables', () => {
  const subject = (sql) => {
    return extractTables(sql)
  }

  expect(subject('SELECT goal_config_id, name FROM goals_config WHERE goal_config_id > (SELECT COUNT(*) - 100 FROM employee) AND 1=1')).toEqual([
    'goals_config',
    'employee'
  ])

  const complexQuery = `
    SELECT
        \`users\`.\`first_name\` AS employee_access_user_first_name,
        job_title
    FROM
        \`employees\`
    LEFT OUTER JOIN \`accesses\` ON \`accesses\`.\`id\` = \`employees\`.\`access_id\`
    LEFT OUTER JOIN \`users\` ON \`users\`.\`id\` = \`accesses\`.\`user_id\`
    INNER JOIN(
        SELECT
            \`custom_fields_values\`.\`long_text_value\` AS job_title,
            crv.\`contract_id\`
        FROM
            \`custom_fields_values\`
        INNER JOIN(
            SELECT
                ANY_VALUE(\`custom_resources_values\`.\`id\`) AS custom_resource_value_id,
                \`contracts_contracts\`.\`id\` AS contract_id
            FROM
                \`custom_resources_values\`
            INNER JOIN \`custom_resources_resources\` ON \`custom_resources_values\`.\`custom_resources_resource_id\` = \`custom_resources_resources\`.\`id\` AND \`custom_resources_resources\`.\`custom_resources_schema_id\` = 110
            INNER JOIN \`contracts_contracts\` ON \`custom_resources_resources\`.\`attachable_type\` = 'Contracts::Contract' AND \`custom_resources_resources\`.\`attachable_id\` = \`contracts_contracts\`.\`id\`
            INNER JOIN \`custom_fields_values\` ON \`custom_fields_values\`.\`custom_field_valuable_type\` = 'CustomResources::Value' AND \`custom_fields_values\`.\`custom_field_valuable_id\` = \`custom_resources_values\`.\`id\`
            WHERE
                \`custom_fields_values\`.\`custom_fields_fields_id\` = 770
            GROUP BY
                contracts_contracts.id
            HAVING
                MAX(
                    \`custom_fields_values\`.\`date_value\`
                )
        ) crv
    ON
        \`custom_fields_values\`.\`custom_field_valuable_id\` = crv.\`custom_resource_value_id\` AND \`custom_fields_values\`.\`custom_fields_fields_id\` = 769
    INNER JOIN \`contracts_contracts\` ON \`contracts_contracts\`.\`id\` = crv.\`contract_id\`
    WHERE
        \`custom_fields_values\`.\`custom_field_valuable_type\` = 'CustomResources::Value'
    ) subquery_job_title
    INNER JOIN \`contracts_contracts\` ON \`employees\`.\`id\` = \`contracts_contracts\`.\`employee_id\` AND subquery_job_title.\`contract_id\` = \`contracts_contracts\`.\`id\`
  `.trim()

  expect(subject(complexQuery)).toEqual([
    'employees',
    'accesses',
    'users',
    'custom_fields_values',
    'custom_resources_values',
    'custom_resources_resources',
    'contracts_contracts'
  ])
})
