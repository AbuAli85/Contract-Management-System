import fs from 'fs';
import path from 'path';
import glob from 'glob';

describe('API must not use email-based privilege escalation', () => {
  it('rejects email-based privilege checks in app/api', () => {
    const pattern = path.join(process.cwd(), 'app', 'api', '**', '*.{ts,tsx}');
    const files = glob.sync(pattern, { nodir: true });

    const badPatterns = [
      /user\.email\s*===/i,
      /===\s*['"][^'"]+@[^'"]+['"]/i,
    ];

    const violations: { file: string; line: number; content: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        for (const re of badPatterns) {
          if (re.test(line)) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
            break;
          }
        }
      });
    }

    if (violations.length > 0) {
      const details = violations
        .map((v) => `${path.relative(process.cwd(), v.file)}:${v.line}: ${v.content}`)
        .join('\n');

      fail(
        [
          'Email-based privilege logic found in app/api.',
          'This is forbidden. Use user_roles/getCompanyRole-based checks instead.',
          '',
          details,
        ].join('\n'),
      );
    }
  });
});

