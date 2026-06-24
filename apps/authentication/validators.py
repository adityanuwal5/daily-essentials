"""Custom password validators plugged into Django's validation engine."""

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class LetterNumberValidator:
    """Require passwords to contain at least one letter and one number.

    Django's built-in validators cover minimum length, common passwords and
    purely numeric passwords, but they do not insist on a *combination* of
    letters and digits. This validator closes that gap so the strict policy
    described in the project spec is fully enforced.
    """

    def validate(self, password, user=None):
        has_letter = any(char.isalpha() for char in password)
        has_digit = any(char.isdigit() for char in password)

        if not has_letter or not has_digit:
            raise ValidationError(
                _("Password must contain a combination of letters and numbers."),
                code="password_no_letter_number",
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least one letter and at least one number."
        )
