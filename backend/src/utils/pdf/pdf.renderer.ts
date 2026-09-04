import PDFDocument from 'pdfkit';

interface ResumeRenderInput {
  title: string;
  templateId?: string | null;
  content: Record<string, any>;
}

export function renderResumeToPdf(input: ResumeRenderInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const headerColor = getTemplateColor(input.templateId);
    doc.fontSize(24).fillColor(headerColor).text(input.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#333333');

    const c = input.content ?? {};

    if (c.personalInfo) {
      const p = c.personalInfo;
      doc.fontSize(14).fillColor(headerColor).text('Personal Information');
      doc.fontSize(11).fillColor('#333333');
      if (p.email) doc.text(`Email: ${p.email}`);
      if (p.phone) doc.text(`Phone: ${p.phone}`);
      if (p.location) doc.text(`Location: ${p.location}`);
      if (p.summary) doc.text(`Summary: ${p.summary}`);
      doc.moveDown();
    }

    if (Array.isArray(c.education) && c.education.length > 0) {
      doc.fontSize(14).fillColor(headerColor).text('Education');
      doc.fontSize(11).fillColor('#333333');
      for (const edu of c.education) {
        doc.text(`${edu.degree ?? ''} at ${edu.institution ?? ''}`);
        if (edu.year) doc.text(`Year: ${edu.year}`);
      }
      doc.moveDown();
    }

    if (Array.isArray(c.experience) && c.experience.length > 0) {
      doc.fontSize(14).fillColor(headerColor).text('Experience');
      doc.fontSize(11).fillColor('#333333');
      for (const exp of c.experience) {
        doc.text(`${exp.role ?? ''} at ${exp.company ?? ''}`);
        if (exp.description) doc.text(String(exp.description));
      }
      doc.moveDown();
    }

    if (Array.isArray(c.skills) && c.skills.length > 0) {
      doc.fontSize(14).fillColor(headerColor).text('Skills');
      doc.fontSize(11).fillColor('#333333');
      doc.text(c.skills.join(', '));
      doc.moveDown();
    }

    if (Array.isArray(c.projects) && c.projects.length > 0) {
      doc.fontSize(14).fillColor(headerColor).text('Projects');
      doc.fontSize(11).fillColor('#333333');
      for (const proj of c.projects) {
        doc.text(`${proj.name ?? ''}: ${proj.description ?? ''}`);
      }
      doc.moveDown();
    }

    doc.end();
  });
}

function getTemplateColor(templateId?: string | null): string {
  switch (templateId) {
    case 'modern':    return '#1a73e8';
    case 'minimal':   return '#555555';
    case 'executive': return '#2c3e50';
    case 'compact':   return '#27ae60';
    default:          return '#333333'; // classic
  }
}
