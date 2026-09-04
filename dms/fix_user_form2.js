const fs = require('fs');
let file = 'client/src/app/(main)/admin/config/users/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<UserFormFields\s+form=\{user\}\s+setForm=\{setUser\}\s+errors=\{errors\}\s+setErrors=\{setErrors\}\s+includePassword=\{true\}\s+layout="create"\s*\/>/m;

const replacement = `<UserFormFields
              form={user}
              setForm={setUser}
              errors={errors}
              setErrors={setErrors}
              includePassword={true}
              layout="create"
              depts={depts}
              positions={positions}
              roles={roles}
            />`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed CreateUserForm!');
} else {
  console.log('Target still not found!');
}
