const fs = require('fs');
let file = 'client/src/app/(main)/admin/config/users/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<UserFormFields
              form={user}
              setForm={setUser}
              errors={errors}
              setErrors={setErrors}
              includePassword={true}
              layout="create"
            />`;

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

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed CreateUserForm!');
} else {
  console.log('Target not found!');
  // Let's print out what actually is there
  const lines = content.split('\n');
  for (let i = 1070; i < 1085; i++) {
    console.log(lines[i]);
  }
}
